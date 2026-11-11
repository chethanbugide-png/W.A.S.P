/* ============================================
   W.A.S.P. — Interactive Scripts & Prediction Engine
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // =========================================
    // UI: Navbar, Mobile Toggle, Smooth Scroll
    // =========================================
    const navbar = document.getElementById('navbar');
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const navToggle = document.getElementById('navToggle');
    const navLinks  = document.getElementById('navLinks');
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(link =>
        link.addEventListener('click', () => navLinks.classList.remove('open'))
    );

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const top = target.getBoundingClientRect().top + window.pageYOffset - 76;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    const sections = document.querySelectorAll('.section, .hero');
    const navItems = document.querySelectorAll('.nav-links a');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(s => {
            if (window.pageYOffset >= s.offsetTop - 130) current = s.getAttribute('id');
        });
        navItems.forEach(item => {
            item.style.color = item.getAttribute('href') === `#${current}` ? 'var(--white)' : '';
        });
    }, { passive: true });


    // =========================================
    // UI: Hero Stat Counter Animation
    // =========================================
    function animateCounter(el) {
        const target = parseFloat(el.dataset.target);
        const decimals = el.dataset.decimals !== undefined ? parseInt(el.dataset.decimals, 10) : 2;
        const duration = 1400;
        const start = performance.now();

        function tick(now) {
            const elapsed = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - elapsed, 3);
            el.textContent = (target * eased).toFixed(decimals);
            if (elapsed < 1) requestAnimationFrame(tick);
            else el.textContent = target.toFixed(decimals);
        }
        requestAnimationFrame(tick);
    }
    document.querySelectorAll('.stat-number[data-target]').forEach(animateCounter);


    // =========================================
    // UI: Scroll-Triggered Fade-In Animations
    // =========================================
    const fadeTargets = [
        '.about-left', '.about-card',
        '.bento-card', '.timeline-step', '.params-ribbon',
        '.table-card', '.ring-card', '.attribution-card', '.site-pill',
        '.team-card', '.advisor-bar', '.section-header-center'
    ];
    fadeTargets.forEach(sel =>
        document.querySelectorAll(sel).forEach(el => el.classList.add('fade-in'))
    );

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const parent = entry.target.parentElement;
                if (parent) {
                    const siblings = Array.from(parent.children).filter(c => c.classList.contains('fade-in'));
                    const idx = siblings.indexOf(entry.target);
                    if (idx >= 0) entry.target.style.transitionDelay = `${Math.min(idx, 5) * 75}ms`;
                }
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));


    // =========================================
    // PREDICTION ENGINE — Constants & Models
    // =========================================
    const FEATURE_WEIGHTS = {
        COD:  0.2788,
        DO:   0.2072,
        Turb: 0.1342,
        EC:   0.1120,
        NH3:  0.1099,
        pH:   0.0807,
        Temp: 0.0388,
        TSS:  0.0383
    };

    const STATS = {
        DO:   { mean: 3.92,   sd: 1.38  },
        BOD:  { mean: 42.25,  sd: 31.84 },
        COD:  { mean: 135.07, sd: 74.62 },
        pH:   { mean: 7.76,   sd: 0.38  },
        Turb: { mean: 25.49,  sd: 15.12 },
        TSS:  { mean: 53.21,  sd: 29.85 },
        NH3:  { mean: 8.0,    sd: 6.0   },
        EC:   { mean: 850,    sd: 450   },
        Temp: { mean: 28.0,   sd: 3.5   }
    };

    const PLANT_PRESETS = {
        trichy:    { DO: 5.86, COD: 47.37,  pH: 7.40, Turb: 8.5,   TSS: 18.0, NH3: 2.5,  EC: 520,  Temp: 28.5 },
        chennai:   { DO: 4.58, COD: 86.90,  pH: 7.60, Turb: 15.0,  TSS: 35.0, NH3: 5.2,  EC: 780,  Temp: 29.0 },
        hyderabad: { DO: 3.74, COD: 138.70, pH: 7.80, Turb: 28.0,  TSS: 55.0, NH3: 8.5,  EC: 920,  Temp: 27.5 },
        bengaluru: { DO: 3.13, COD: 164.70, pH: 7.90, Turb: 38.0,  TSS: 72.0, NH3: 11.0, EC: 1050, Temp: 26.5 },
        vellore:   { DO: 2.29, COD: 237.68, pH: 8.10, Turb: 46.11, TSS: 86.0, NH3: 16.0, EC: 1480, Temp: 30.0 }
    };

    const QUICK_PRESETS = {
        clean:           { DO: 6.50, COD: 32.0,  pH: 7.20, Turb: 5.0,  TSS: 12.0,  NH3: 1.8,  EC: 420,  Temp: 27.0 },
        polluted:        { DO: 4.20, COD: 95.0,  pH: 7.80, Turb: 18.0, TSS: 45.0,  NH3: 7.5,  EC: 850,  Temp: 28.5 },
        highly_polluted: { DO: 2.50, COD: 210.0, pH: 8.20, Turb: 52.0, TSS: 95.0,  NH3: 18.0, EC: 1350, Temp: 30.0 },
        shock:           { DO: 1.20, COD: 380.0, pH: 8.80, Turb: 95.0, TSS: 180.0, NH3: 35.0, EC: 2200, Temp: 32.0 }
    };

    function predictBOD5(DO, COD, pH, Turb, TSS, NH3, EC, Temp) {
        const z_DO   = (DO - STATS.DO.mean) / STATS.DO.sd;
        const z_COD  = (COD - STATS.COD.mean) / STATS.COD.sd;
        const z_pH   = (pH - STATS.pH.mean) / STATS.pH.sd;
        const z_Turb = (Turb - STATS.Turb.mean) / STATS.Turb.sd;
        const z_TSS  = (TSS - STATS.TSS.mean) / STATS.TSS.sd;
        const z_NH3  = (NH3 - STATS.NH3.mean) / STATS.NH3.sd;
        const z_EC   = (EC - STATS.EC.mean) / STATS.EC.sd;
        const z_Temp = (Temp - STATS.Temp.mean) / STATS.Temp.sd;

        const composite =
            FEATURE_WEIGHTS.COD  * z_COD  * 1.0 +
            FEATURE_WEIGHTS.DO   * z_DO   * (-1.0) +
            FEATURE_WEIGHTS.Turb * z_Turb * 1.0 +
            FEATURE_WEIGHTS.EC   * z_EC   * 0.8 +
            FEATURE_WEIGHTS.NH3  * z_NH3  * 1.0 +
            FEATURE_WEIGHTS.pH   * z_pH   * 0.4 +
            FEATURE_WEIGHTS.Temp * z_Temp * 0.5 +
            FEATURE_WEIGHTS.TSS  * z_TSS  * 0.7;

        let bod = STATS.BOD.mean + composite * STATS.BOD.sd;
        if (COD > 200) bod *= 1.0 + (COD - 200) * 0.0008;
        if (DO < 2.0)  bod *= 1.0 + (2.0 - DO) * 0.15;

        return Math.max(1.0, Math.min(bod, 250.0));
    }

    function classifyWaterQuality(bod, DO, COD, Turb, pH) {
        let score = 0;
        if (bod > 10 && bod <= 30) score += 1.0;
        else if (bod > 30) score += 2.0 + Math.min((bod - 30) / 50, 1.0);

        if (DO >= 3.5 && DO < 5.0) score += 0.8;
        else if (DO < 3.5) score += 1.5 + Math.min((3.5 - DO) / 2.0, 1.0);

        if (COD > 50 && COD <= 150) score += 0.6;
        else if (COD > 150) score += 1.2 + Math.min((COD - 150) / 100, 0.8);

        if (Turb > 10 && Turb <= 25) score += 0.3;
        else if (Turb > 25) score += 0.7;

        if ((pH < 6.5 || pH > 8.5) && pH >= 6.0 && pH <= 9.0) score += 0.3;
        else if (pH < 6.0 || pH > 9.0) score += 0.8;

        const severity = score / 5.0;
        if (severity <= 0.23) return { cls: 0, label: 'Acceptable',      severity };
        if (severity <= 0.47) return { cls: 1, label: 'Polluted',        severity };
        return                       { cls: 2, label: 'Highly Polluted', severity };
    }

    function computeEPLI(bod, COD, TSS, DO) {
        const bod_norm = Math.max(0, (bod - 10) / 10);
        const cod_norm = Math.max(0, (COD - 50) / 50);
        const tss_norm = Math.max(0, (TSS - 20) / 20);
        const do_norm  = Math.max(0, (5.0 - DO) / 5.0);
        const epli = (bod_norm * 0.35 + cod_norm * 0.30 + tss_norm * 0.20 + do_norm * 0.15) * 100;
        return Math.max(0, Math.min(epli, 200));
    }

    function computeMahalanobisD2(DO, COD, pH, Turb, TSS, NH3, EC, Temp) {
        const z = [
            (DO - STATS.DO.mean) / STATS.DO.sd,
            (COD - STATS.COD.mean) / STATS.COD.sd,
            (pH - STATS.pH.mean) / STATS.pH.sd,
            (Turb - STATS.Turb.mean) / STATS.Turb.sd,
            (TSS - STATS.TSS.mean) / STATS.TSS.sd,
            (NH3 - STATS.NH3.mean) / STATS.NH3.sd,
            (EC - STATS.EC.mean) / STATS.EC.sd,
            (Temp - STATS.Temp.mean) / STATS.Temp.sd
        ];
        return z.reduce((sum, zi) => sum + zi * zi, 0);
    }

    function simulateTertiaryUpgrade(bod, COD, TSS, DO) {
        // Report benchmarks: ~66.0% BOD5 removal, ~62.0% COD removal, ~70% TSS removal, DO +2.58 mg/L
        const postBOD  = bod * 0.34;
        const postCOD  = COD * 0.38;
        const postTSS  = TSS * 0.30;
        const postDO   = Math.min(DO + 2.58, 9.5);
        const postEPLI = computeEPLI(postBOD, postCOD, postTSS, postDO);
        const bodDrop  = ((bod - postBOD) / bod) * 100;
        return { postBOD, postCOD, postTSS, postDO, postEPLI, bodDrop };
    }

    function getControlActions(cls, bod, DO, pH, isShock) {
        const actions = [];

        if (isShock) {
            actions.push({
                title: '🚨 SHOCK ALERT — Divert Influent Immediately',
                desc: 'Mahalanobis D² ≥ 22.0. Trigger motorized diversion valves to route influent to equalization shock tank, notify CPCB, and audit upstream industrial lines.'
            });
        }

        if (cls === 0) {
            actions.push({
                title: '✅ ACCEPTABLE — Maintain Baseline Operations',
                desc: `BOD₅ = ${bod.toFixed(1)} mg/L, DO = ${DO.toFixed(1)} mg/L. Maintain fine-bubble aeration and approve safe river discharge or irrigation reuse per CPCB norms.`
            });
        } else if (cls === 1) {
            actions.push({
                title: '⚠️ POLLUTED — Boost Aeration & Dose PAC',
                desc: `BOD₅ = ${bod.toFixed(1)} mg/L exceeds 10 mg/L STP norm. Increase blower DO by +35%, dose Polyaluminium Chloride (PAC) coagulant, and extend secondary clarifier retention.`
            });
        } else {
            actions.push({
                title: '🔴 HIGHLY POLLUTED — Engage Tertiary Treatment',
                desc: `BOD₅ = ${bod.toFixed(1)} mg/L, DO = ${DO.toFixed(1)} mg/L. Engage MBBR carriers, PAC + 0.02µm UF membranes, and ozone polishing. Halt river outfall and recirculate effluent.`
            });
        }

        if (pH < 6.5 || pH > 8.5) {
            actions.push({
                title: `⚗️ pH DRIFT ALERT — pH = ${pH.toFixed(2)}`,
                desc: pH < 6.5
                    ? 'Acidic drift detected. Activate automated lime Ca(OH)₂ PID dosing to protect nitrifying biomass.'
                    : 'Alkaline drift detected. Activate automated sulfuric acid H₂SO₄ PID dosing to stabilize pH near 7.2.'
            });
        }

        return actions;
    }

    function getParamStatus(name, value) {
        switch (name) {
            case 'DO':   return value >= 5.0 ? 'safe' : value >= 3.5 ? 'warning' : 'danger';
            case 'BOD':  return value <= 10  ? 'safe' : value <= 30  ? 'warning' : 'danger';
            case 'COD':  return value <= 50  ? 'safe' : value <= 150 ? 'warning' : 'danger';
            case 'pH':   return (value >= 6.5 && value <= 8.5) ? 'safe' : (value >= 6.0 && value <= 9.0) ? 'warning' : 'danger';
            case 'Turb': return value <= 10  ? 'safe' : value <= 25  ? 'warning' : 'danger';
            case 'TSS':  return value <= 20  ? 'safe' : value <= 100 ? 'warning' : 'danger';
            case 'NH3':  return value <= 5   ? 'safe' : value <= 15  ? 'warning' : 'danger';
            case 'EC':   return value <= 1500 ? 'safe' : value <= 2200 ? 'warning' : 'danger';
            case 'Temp': return (value >= 15 && value <= 35) ? 'safe' : 'warning';
            default:     return 'safe';
        }
    }

    const STATUS_LABELS = { safe: 'Safe', warning: 'Warn', danger: 'High' };
    const STATUS_COLORS = { safe: '#22c55e', warning: '#f59e0b', danger: '#ef4444' };


    // =========================================
    // UI: Inputs, Sliders, Presets & Live Sync
    // =========================================
    const KEYS = ['DO', 'COD', 'pH', 'Turb', 'TSS', 'NH3', 'EC', 'Temp'];
    const inputs  = {};
    const sliders = {};
    const dots    = {};
    const tags    = {};

    KEYS.forEach(k => {
        inputs[k]  = document.getElementById(`input${k}`);
        sliders[k] = document.getElementById(`slider${k}`);
        dots[k]    = document.getElementById(`dot${k}`);
        tags[k]    = document.getElementById(`tag${k}`);
    });

    const plantSelect = document.getElementById('plantSelect');
    const liveToggle  = document.getElementById('liveToggle');
    const presetBtns  = document.querySelectorAll('.btn-chip');

    let lastReportText = '';

    function updateFieldVisual(key, value) {
        const slider = sliders[key];
        const dot    = dots[key];
        const tag    = tags[key];
        const field  = inputs[key].closest('.input-field');

        field.classList.remove('invalid');

        if (isNaN(value)) {
            dot.className = 'field-status-dot';
            tag.className = 'field-badge';
            tag.textContent = '—';
            slider.style.background = 'rgba(255,255,255,0.08)';
            return;
        }

        const status = getParamStatus(key, value);
        dot.className = `field-status-dot ${status}`;
        tag.className = `field-badge ${status}`;
        tag.textContent = STATUS_LABELS[status];

        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const clamped = Math.max(min, Math.min(max, value));
        slider.value = clamped;
        const pct = ((clamped - min) / (max - min)) * 100;
        const col = STATUS_COLORS[status];
        slider.style.background = `linear-gradient(90deg, ${col} ${pct}%, rgba(255,255,255,0.08) ${pct}%)`;
    }

    function fillInputs(data) {
        KEYS.forEach(k => {
            inputs[k].value = data[k];
            updateFieldVisual(k, data[k]);
        });
    }

    function clearActivePresets() {
        presetBtns.forEach(b => b.classList.remove('active'));
    }

    // Bidirectional sync: Number input <-> Range slider
    KEYS.forEach(key => {
        inputs[key].addEventListener('input', () => {
            plantSelect.value = 'custom';
            clearActivePresets();
            const val = parseFloat(inputs[key].value);
            updateFieldVisual(key, val);
            if (liveToggle.checked && KEYS.every(k => !isNaN(parseFloat(inputs[k].value)))) {
                runAnalysis();
            }
        });

        sliders[key].addEventListener('input', () => {
            plantSelect.value = 'custom';
            clearActivePresets();
            const val = parseFloat(sliders[key].value);
            inputs[key].value = val;
            updateFieldVisual(key, val);
            if (liveToggle.checked && KEYS.every(k => !isNaN(parseFloat(inputs[k].value)))) {
                runAnalysis();
            }
        });
    });

    plantSelect.addEventListener('change', () => {
        clearActivePresets();
        const preset = PLANT_PRESETS[plantSelect.value];
        if (preset) {
            fillInputs(preset);
            runAnalysis();
        }
    });

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = QUICK_PRESETS[btn.dataset.preset];
            if (!preset) return;
            clearActivePresets();
            btn.classList.add('active');
            plantSelect.value = 'custom';
            fillInputs(preset);
            runAnalysis();
        });
    });

    document.getElementById('btnReset').addEventListener('click', () => {
        plantSelect.value = 'custom';
        clearActivePresets();
        KEYS.forEach(k => {
            inputs[k].value = '';
            updateFieldVisual(k, NaN);
        });
        document.getElementById('outputResults').style.display = 'none';
        document.getElementById('outputPlaceholder').style.display = 'block';
    });

    document.getElementById('btnAnalyze').addEventListener('click', runAnalysis);


    // =========================================
    // COPY REPORT BUTTON
    // =========================================
    const btnCopyLog = document.getElementById('btnCopyLog');
    btnCopyLog.addEventListener('click', async () => {
        if (!lastReportText) return;
        try {
            await navigator.clipboard.writeText(lastReportText);
            btnCopyLog.textContent = '✓ Copied!';
            setTimeout(() => { btnCopyLog.textContent = 'Copy Report'; }, 1800);
        } catch {
            btnCopyLog.textContent = 'Copied';
            setTimeout(() => { btnCopyLog.textContent = 'Copy Report'; }, 1800);
        }
    });


    // =========================================
    // ANALYZE & RENDER OUTPUT
    // =========================================
    function runAnalysis() {
        let firstMissing = null;
        const vals = {};

        KEYS.forEach(key => {
            const num = parseFloat(inputs[key].value);
            vals[key] = num;
            if (isNaN(num)) {
                inputs[key].closest('.input-field').classList.add('invalid');
                if (!firstMissing) firstMissing = inputs[key];
            } else {
                inputs[key].closest('.input-field').classList.remove('invalid');
            }
        });

        if (firstMissing) {
            firstMissing.focus();
            return;
        }

        const { DO, COD, pH, Turb, TSS, NH3, EC, Temp } = vals;

        // 1. Computations
        const bod = predictBOD5(DO, COD, pH, Turb, TSS, NH3, EC, Temp);
        const classification = classifyWaterQuality(bod, DO, COD, Turb, pH);
        const epli = computeEPLI(bod, COD, TSS, DO);
        const d2 = computeMahalanobisD2(DO, COD, pH, Turb, TSS, NH3, EC, Temp);
        const isShock = d2 >= 22.0;
        const ratio = COD / Math.max(bod, 0.1);
        const upgrade = simulateTertiaryUpgrade(bod, COD, TSS, DO);
        const postClass = classifyWaterQuality(upgrade.postBOD, upgrade.postDO, upgrade.postCOD, Turb * 0.28, pH);
        const actions = getControlActions(classification.cls, bod, DO, pH, isShock);

        // 2. Ensure output panel visible
        document.getElementById('outputPlaceholder').style.display = 'none';
        const results = document.getElementById('outputResults');
        results.style.display = 'flex';

        // 3. BOD5 Semicircle Gauge (arc length = 267.04)
        const clsKey = ['acceptable', 'polluted', 'highly_polluted'][classification.cls];
        const gaugeColors = ['var(--green)', 'var(--yellow)', 'var(--red)'];
        document.getElementById('resultBOD').className = 'result-gauge-card ' + clsKey;
        document.getElementById('resultBODValue').textContent = bod.toFixed(2);

        const limitPill = document.getElementById('cpcbLimitPill');
        if (bod <= 10) {
            limitPill.className = 'cpcb-limit-pill pass';
            limitPill.textContent = '✓ Meets CPCB ≤ 10 mg/L';
        } else {
            limitPill.className = 'cpcb-limit-pill fail';
            limitPill.textContent = `↑ ${(bod - 10).toFixed(1)} mg/L above STP norm`;
        }

        const arc = document.getElementById('gaugeArc');
        const arcLen = 267.04;
        const gaugePct = Math.min(1, bod / 120);
        arc.style.stroke = gaugeColors[classification.cls];
        arc.style.strokeDashoffset = (arcLen * (1 - gaugePct)).toFixed(2);

        // 4. Classification Side
        const badge = document.getElementById('classBadge');
        badge.className = 'class-badge-big ' + clsKey;
        badge.textContent = classification.label;
        document.getElementById('classTier').textContent = `Class ${classification.cls} — CPCB Water Quality`;

        const classDescs = [
            'Effluent satisfies CPCB secondary standards (BOD₅ ≤ 10 mg/L, DO ≥ 5.0 mg/L). Safe for discharge.',
            'Moderately overloaded stream (10 < BOD₅ ≤ 30 mg/L). Increase aeration and dose PAC coagulant.',
            'Severe organic/industrial load (BOD₅ > 30 mg/L or DO < 3.5 mg/L). Engage tertiary MBBR + UF + O₃.'
        ];
        document.getElementById('classDesc').textContent = classDescs[classification.cls];

        // 5. EPLI Score
        document.getElementById('epliValue').textContent = epli.toFixed(1);
        const epliBar = document.getElementById('epliBar');
        const epliPct = Math.min(100, (epli / 150) * 100);
        epliBar.className = 'dual-bar-fill ' + (epli < 20 ? 'low' : epli < 50 ? 'medium' : epli < 100 ? 'high' : 'critical');
        epliBar.style.width = `${epliPct}%`;

        // 6. Mahalanobis D²
        const anomalyCard = document.getElementById('anomalyCard');
        anomalyCard.className = 'dual-card' + (isShock ? ' shock' : '');
        document.getElementById('anomalyScore').textContent = d2.toFixed(2);
        document.getElementById('anomalyIndicator').className = 'anomaly-indicator ' + (isShock ? 'shock' : 'normal');
        document.getElementById('anomalyDot').className = 'anomaly-dot ' + (isShock ? 'shock' : 'normal');
        document.getElementById('anomalyLabel').textContent = isShock ? 'SHOCK ALERT' : 'Normal';

        // 7. COD / BOD5 Biodegradability Ratio
        document.getElementById('ratioValue').textContent = ratio.toFixed(2);
        const ratioLabel = document.getElementById('ratioLabel');
        if (ratio < 2.0) {
            ratioLabel.className = 'ratio-pill bio';
            ratioLabel.textContent = 'Biodegradable';
        } else if (ratio <= 2.6) {
            ratioLabel.className = 'ratio-pill mixed';
            ratioLabel.textContent = 'Mixed Load';
        } else {
            ratioLabel.className = 'ratio-pill refrac';
            ratioLabel.textContent = 'Refractory';
        }

        // 8. Parameter Compliance Grid (.rp-chip with mini fill bars)
        const paramData = [
            { name: 'DO',   label: 'DO',    value: DO,   unit: 'mg/L', max: 10 },
            { name: 'BOD',  label: 'BOD₅',  value: bod,  unit: 'mg/L', max: 100 },
            { name: 'COD',  label: 'COD',   value: COD,  unit: 'mg/L', max: 300 },
            { name: 'pH',   label: 'pH',    value: pH,   unit: '',     max: 14 },
            { name: 'Turb', label: 'Turb',  value: Turb, unit: 'NTU',  max: 80 },
            { name: 'TSS',  label: 'TSS',   value: TSS,  unit: 'mg/L', max: 150 },
            { name: 'NH3',  label: 'NH₃-N', value: NH3,  unit: 'mg/L', max: 30 },
            { name: 'EC',   label: 'EC',    value: EC,   unit: 'µS',   max: 2500 },
            { name: 'Temp', label: 'Temp',  value: Temp, unit: '°C',   max: 45 }
        ];

        document.getElementById('paramStatusGrid').innerHTML = paramData.map(p => {
            const status = getParamStatus(p.name, p.value);
            const formatted = p.name === 'pH' ? p.value.toFixed(2) : p.name === 'EC' ? Math.round(p.value) : p.value.toFixed(1);
            const barPct = Math.min(100, Math.max(8, (p.value / p.max) * 100));
            return `
                <div class="rp-chip">
                    <div class="rp-chip-top">
                        <span class="rp-dot ${status}"></span>
                        <span class="rp-name">${p.label}</span>
                        <span class="rp-val">${formatted}${p.unit ? ' ' + p.unit : ''}</span>
                    </div>
                    <div class="rp-mini-track">
                        <div class="rp-mini-fill ${status}" style="width:${barPct.toFixed(0)}%"></div>
                    </div>
                </div>`;
        }).join('');

        // 9. Multi-Parameter Tertiary Upgrade Bars
        const upgradeRows = [
            { name: 'BOD₅', pre: bod,  post: upgrade.postBOD,  max: Math.max(bod, 60),  unit: 'mg/L' },
            { name: 'COD',  pre: COD,  post: upgrade.postCOD,  max: Math.max(COD, 150), unit: 'mg/L' },
            { name: 'DO',   pre: DO,   post: upgrade.postDO,   max: 10,                 unit: 'mg/L' },
            { name: 'EPLI', pre: epli, post: upgrade.postEPLI, max: Math.max(epli, 80), unit: '' }
        ];

        document.getElementById('upgradeBars').innerHTML = upgradeRows.map(r => {
            const prePct  = Math.min(100, Math.max(4, (r.pre / r.max) * 100));
            const postPct = Math.min(100, Math.max(4, (r.post / r.max) * 100));
            return `
                <div class="ub-row">
                    <span class="ub-name">${r.name}</span>
                    <div class="ub-tracks">
                        <div class="ub-bar pre" style="width:${prePct.toFixed(1)}%"></div>
                        <div class="ub-bar post" style="width:${postPct.toFixed(1)}%"></div>
                    </div>
                    <div class="ub-vals">${r.pre.toFixed(1)} → <span>${r.post.toFixed(1)}</span>${r.unit ? ' ' + r.unit : ''}</div>
                </div>`;
        }).join('');

        document.getElementById('upgradeReduction').textContent = `-${upgrade.bodDrop.toFixed(1)}%`;
        document.getElementById('postBOD').textContent = `${upgrade.postBOD.toFixed(2)} mg/L`;
        document.getElementById('upgradePostClass').textContent = `${postClass.label} (Class ${postClass.cls})`;

        // 10. Actions & Copyable Lab Log
        document.getElementById('actionContent').innerHTML = actions.map(a => `
            <div class="action-item">
                <div class="action-title">${a.title}</div>
                <div class="action-desc">${a.desc}</div>
            </div>`).join('');

        const stationName = plantSelect.options[plantSelect.selectedIndex].text.replace('📍 ', '');
        lastReportText = [
            '====================================================================',
            'W.A.S.P. — WASTEWATER ANALYSIS & SUPERVISED PREDICTION REPORT',
            `Station: ${stationName}`,
            '--------------------------------------------------------------------',
            `Inputs : DO=${DO.toFixed(2)} mg/L | COD=${COD.toFixed(2)} mg/L | pH=${pH.toFixed(2)} | Turb=${Turb.toFixed(2)} NTU`,
            `         TSS=${TSS.toFixed(1)} mg/L | NH3-N=${NH3.toFixed(1)} mg/L | EC=${Math.round(EC)} uS/cm | Temp=${Temp.toFixed(1)} C`,
            `Output : Predicted BOD5 = ${bod.toFixed(2)} mg/L | Class ${classification.cls} (${classification.label})`,
            `Metrics: EPLI = ${epli.toFixed(1)} | Mahalanobis D^2 = ${d2.toFixed(2)} (${isShock ? 'SHOCK ALERT' : 'Normal'}) | COD/BOD5 = ${ratio.toFixed(2)}`,
            `Upgrade: Pre BOD5=${bod.toFixed(2)} mg/L -> Post BOD5=${upgrade.postBOD.toFixed(2)} mg/L (${postClass.label}, -${upgrade.bodDrop.toFixed(1)}%)`,
            `Action : ${actions.map(a => a.title + ' — ' + a.desc).join('\n         ')}`,
            '===================================================================='
        ].join('\n');
    }

    // Initialize default station (Chennai — Nesapakkam STP) on load
    fillInputs(PLANT_PRESETS[plantSelect.value] || PLANT_PRESETS.chennai);
    runAnalysis();
});

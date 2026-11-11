from pathlib import Path
import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(
    page_title="W.A.S.P. — Wastewater Analysis & Supervised Prediction",
    page_icon="⬡",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Make the Streamlit container full-bleed dark navy so the embedded app fills the viewport cleanly
st.markdown(
    """
    <style>
        #MainMenu, header, footer, [data-testid="stHeader"], [data-testid="stToolbar"], [data-testid="stDecoration"] {
            display: none !important;
        }
        html, body, [data-testid="stAppViewContainer"], [data-testid="stMain"], .main {
            background-color: #060d1a !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
        }
        .block-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
        }
        iframe {
            width: 100vw !important;
            height: 100vh !important;
            border: none !important;
            display: block !important;
        }
    </style>
    """,
    unsafe_allow_html=True,
)

ROOT = Path(__file__).parent
html = (ROOT / "index.html").read_text(encoding="utf-8")
css = (ROOT / "styles.css").read_text(encoding="utf-8")
js = (ROOT / "script.js").read_text(encoding="utf-8")

# Inline local stylesheet and script so components.html serves a self-contained page
html = html.replace('<link rel="stylesheet" href="styles.css">', f"<style>{css}</style>")
html = html.replace('<script src="script.js"></script>', f"<script>{js}</script>")

components.html(html, height=900, scrolling=True)

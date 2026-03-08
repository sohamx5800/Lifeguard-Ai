import streamlit as st
import pandas as pd
import requests

st.set_page_config(
    page_title="Lifeguard AI Command Center",
    layout="wide"
)

st.title("🚨 Lifeguard AI Accident Monitoring Dashboard")

API_URL = "http://127.0.0.1:8000/api/accidents"

try:

    response = requests.get(API_URL)

    if response.status_code == 200:

        result = response.json()

        accidents = result["data"]

        if len(accidents) == 0:

            st.warning("No accidents recorded yet")

        else:

            df = pd.DataFrame(accidents)

            st.metric("Total Accidents", result["total_accidents"])

            st.dataframe(df)

            st.subheader("Accident Details")

            for accident in accidents:

                st.markdown(f"""
                **Vehicle ID:** {accident['car_id']}

                **Impact Type:** {accident['impact']}

                **Passengers:** {accident['passengers']}

                **Severity:** {accident['severity']}

                **Dispatch Status:** {accident['status']}

                **Location:**  
                https://maps.google.com/?q={accident['latitude']},{accident['longitude']}

                ---
                """)

    else:

        st.error("API server not responding")

except Exception as e:

    st.error(f"Server connection error: {e}")
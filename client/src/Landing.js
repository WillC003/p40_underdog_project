import React from "react";

const LandingPage = () => {
    return (
        <div style={styles.container}>
        {/* Logo Section */}
        <div style={styles.logoContainer}>
          <img src="/favicon.ico" alt="P-40 Underdogs Logo" style={styles.logo} />
        </div>
  
        {/* Project Title & Description */}
        <div style={styles.textContainer}>
          <h1 style={styles.title}>P-40 Underdog Project</h1>
          <p style={styles.paragraph}>
            The P-40 Underdog Project is revolutionizing human and animal
            interactions by building bridges between ULM and the NELA community –
            because we ALL deserve to be rescued.
          </p>
        </div>
  
        {/* Vision Section */}
        <div style={styles.textContainer}>
          <h2 style={styles.sectionTitle}>Our vision is to:</h2>
          <ul style={styles.list}>
            <li>End dog and cat homelessness in Northeast Louisiana</li>
            <li>
              Establish ULM as the pioneer in mental health awareness and support
              pet use
            </li>
          </ul>
        </div>
  
        {/* Objectives Section */}
        <div style={styles.textContainer}>
          <h2 style={styles.sectionTitle}>Our objectives are to:</h2>
          <ul style={styles.list}>
            <li>Continuously move to reduce animal homelessness in NELA</li>
            <li>
              Be a pioneer in using animals to improve the mental health of a
              campus community
            </li>
            <li>
              Create readily available, accessible opportunities for engagement on
              ULM's campus
            </li>
            <li>
              Reinforce ULM’s commitment to overcoming hardship and adversity
            </li>
          </ul>
        </div>
      </div>
  
    );
  };
   
  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#f5f5f5",
      textAlign: "center",
      padding: "20px",
    },
    logoContainer: {
      marginTop: "20px",
    },
    logo: {
      height: "100px",
      width: "100px",
    },
    textContainer: {
      marginTop: "20px",
      maxWidth: "600px",
      padding: "10px",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#873b3b"
    },
    paragraph: {
      marginTop: "10px",
      color: "#555",
    },
    sectionTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "#873b3b",
    },
    list: {
      marginTop: "10px",
      color: "#555",
      textAlign: "left",
    },
  };
  
export default LandingPage;
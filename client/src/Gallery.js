import React from "react";

const Gallery = () => {
  const dogProfiles = [
    {
      image: "https://images.squarespace-cdn.com/content/v1/54822a56e4b0b30bd821480c/29708160-9b39-42d0-a5ed-4f8b9c85a267/labrador+retriever+dans+pet+care.jpeg?format=2500w",
      name: "Buddy",
      breed: "Labrador Retriever"
    },
    {
      image: "https://images.squarespace-cdn.com/content/v1/54822a56e4b0b30bd821480c/51fe71a3-cb12-4ac2-882f-45955401dd53/Golden+Retrievers+dans+pet+care.jpeg?format=2500w",
      name: "Max",
      breed: "Golden Retriever"
    },
    {
      image: "https://images.squarespace-cdn.com/content/v1/54822a56e4b0b30bd821480c/4e17ec01-850d-4fda-a446-e68ff71854ba/German+Shepherds+dans+pet+care.jpeg?format=2500w",
      name: "Rex",
      breed: "German Shepherd"
    },
    {
      image: "https://media-be.chewy.com/wp-content/uploads/2018/05/shaggy-dog-breeds1-x-670-440x.jpg",
      name: "Fluffy",
      breed: "Shaggy Mix"
    },
    {
      image: "https://media-be.chewy.com/wp-content/uploads/2018/05/shaggy-dog-breeds3-x-670-440x.jpg",
      name: "Luna",
      breed: "Bearded Collie"
    },
  ];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Our Dogs</h2>
      <div style={styles.galleryContainer}>
        {dogProfiles.map((dog, index) => (
          <div key={index} style={styles.profileContainer}>
            <div style={styles.imageContainer}>
              <img 
                src={dog.image} 
                alt={`${dog.name} - ${dog.breed}`} 
                style={styles.image} 
              />
            </div>
            <div style={styles.dogInfo}>
              <h3 style={styles.dogName}>{dog.name}</h3>
              <p style={styles.dogBreed}>{dog.breed}</p>
            </div>
          </div>
        ))}
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
    padding: "40px 20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  title: {
    fontSize: "36px",
    fontWeight: "bold",
    color: "#d32f2f", // Red for the title
    marginBottom: "30px",
    textShadow: "1px 1px 2px rgba(0, 0, 0, 0.1)",
  },
  galleryContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "30px",
    maxWidth: "1200px",
  },
  profileContainer: {
    width: "280px",
    display: "flex",
    flexDirection: "column",
    marginBottom: "20px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    transition: "transform 0.3s ease",
    "&:hover": {
      transform: "scale(1.03)",
    }
  },
  imageContainer: {
    width: "100%",
    height: "220px",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover", // This ensures the image covers the container while maintaining aspect ratio
    transition: "transform 0.5s ease",
    "&:hover": {
      transform: "scale(1.1)",
    }
  },
  dogInfo: {
    padding: "15px",
    backgroundColor: "#ffffff",
  },
  dogName: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#d32f2f", // Red for the name
    marginBottom: "5px",
  },
  dogBreed: {
    fontSize: "16px",
    color: "#666", // Grey for the breed
    marginTop: "0",
  },
};

export default Gallery;
import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/UserProfile.css";
import penIcon from "../assets/pen.png";
import { LogoutButton } from "../components/Logoutbutton";

const UserProfile = () => {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    accountType: "",
    studentNumber: "",
    vehicleType: "",
    plateNumber: "",
    password: "********",
    image: "/default-avatar.png",
  });

  const [parkingHistory, setParkingHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [editingField, setEditingField] = useState(null);
  const [tempProfile, setTempProfile] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:8080/personalized-account", { withCredentials: true })
      .then((res) => {
        setProfile({
          firstName: res.data.first_name || "",
          lastName: res.data.last_name || "",
          email: res.data.email || "",
          accountType: res.data.account_type || "",
          studentNumber: res.data.student_id || "",
          vehicleType: res.data.vehicles?.[0]?.vehicle_type || "",
          plateNumber: res.data.vehicles?.[0]?.vehicle_plate || "",
          password: "********",
          image: res.data.profile_image || "/default-avatar.png",
        });
        setParkingHistory(res.data.parkingHistory || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching profile:", err);
        setLoading(false);
      });
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = () => {
    if (!selectedFile) return alert("Please select an image first");

    const formData = new FormData();
    formData.append("file", selectedFile);

    axios
      .post("http://localhost:8080/upload-profile-pic", formData, { withCredentials: true })
      .then(() => {
        alert("Profile picture uploaded successfully");
        return axios.get("http://localhost:8080/personalized-account", { withCredentials: true });
      })
      .then((res) => {
        setProfile((prev) => ({
          ...prev,
          image: res.data.profile_image || "/default-avatar.png",
        }));
        setSelectedFile(null);
      })
      .catch((err) => {
        console.error("Error uploading profile picture:", err);
        alert("Failed to upload profile picture");
      });
  };

  const handleEditClick = (field) => {
    setEditingField(field);
    setTempProfile(profile);
  };

  const handleChange = (field, value) => {
    setTempProfile((prev) => ({ ...prev, [field]: value }));
  };

 const handleSave = () => {
  const updatedProfile = {
    first_name: tempProfile.firstName,
    last_name: tempProfile.lastName,
    email: tempProfile.email,
    password: tempProfile.password, // only include if you're allowing password change
    vehicles: [
      {
        vehicle_type: tempProfile.vehicleType,
        vehicle_plate: tempProfile.plateNumber,
      },
    ],
  };

  axios
    .put("http://localhost:8080/update-profile", updatedProfile, { withCredentials: true })
    .then(() => {
      setProfile(tempProfile);
      setEditingField(null);
      alert("Profile updated successfully");
    })
    .catch((err) => {
      console.error("Error updating profile:", err);
      alert("Failed to update profile");
    });
};


  const handleLogout = () => {
    axios
      .post("http://localhost:8080/logout", {}, { withCredentials: true })
      .then(() => {
        window.location.href = "/";
      })
      .catch((err) => {
        console.error("Error logging out:", err);
        alert("An error occurred while logging out. Please try again.");
      });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <section className="userProfile__layout">
      <div className="profile-container">
        <h2 className="userAccount__title">Account Settings</h2>
        <div className="profile-wrapper">
          <div className="sidebar">
            <button
              onClick={() => setActiveTab("profile")}
              className={activeTab === "profile" ? "sidebar-button active" : "sidebar-button"}
            >
              Profile Details
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={activeTab === "history" ? "sidebar-button active" : "sidebar-button"}
            >
              History
            </button>
          </div>

          <div className="content-section">
            {activeTab === "profile" ? (
              <div className="profile-sections-box">
                <h2 className="My-profile-title">My Profile</h2>
                <div className="profile-header">
                  <div className="profile-image-container">
                    <label htmlFor="profile-image-input" className="profile-image-label">
                      <img
                        src={profile.image}
                        alt="Profile"
                        className="profile-image"
                      />
                      <div className="profile-image-overlay">Change Photo</div>
                    </label>
                    <input
                      id="profile-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                    {selectedFile && (
                      <button className="upload-button" onClick={handleFileUpload}>
                        Save
                      </button>
                    )}
                  </div>

                  <div className="profile-info-container">
                    <h2 className="accountFullname">{profile.firstName} {profile.lastName}</h2>
                    <p className="accountDisplaytype">{profile.accountType}</p>
                    <p className="accountDisplayemail">{profile.email}</p>
                  </div>
                </div>

                <div className="personal-infoBox">
                  <h3 className="section-title">Personal Information</h3>
                  <div className="info-content">
                    <p><strong>First Name:</strong> {profile.firstName}</p>
                    <p><strong>Last Name:</strong> {profile.lastName}</p>
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p><strong>Student Number:</strong> {profile.studentNumber}</p>
                  </div>
                  <div className="edit-button-container">
                    <button onClick={() => handleEditClick("personal")} className="edit-button">
                      Edit <img src={penIcon} alt="Edit" className="pen-icon" />
                    </button>
                  </div>
                </div>

                <div className="account-securityBox">
                  <h3 className="content-title">Account Security</h3>
                  <div className="security-content">
                    <p><strong>Password:</strong> {profile.password}</p>
                  </div>
                  <div className="edit-button-container">
                    <button onClick={() => handleEditClick("security")} className="edit-button">
                      Edit <img src={penIcon} alt="Edit" className="pen-icon" />
                    </button>
                  </div>
                </div>

                <div className="vehicle-infoBox">
                  <h3 className="content-title">Vehicle Information</h3>
                  <div className="vehicle-content">
                    <p><strong>Type of Vehicle:</strong> {profile.vehicleType}</p>
                    <p><strong>Plate Number:</strong> {profile.plateNumber}</p>
                  </div>
                  <div className="edit-button-container">
                    <button onClick={() => handleEditClick("vehicle")} className="edit-button">
                      Edit <img src={penIcon} alt="Edit" className="pen-icon" />
                    </button>
                  </div>
                </div>

                <LogoutButton onLogoutClick={handleLogout} />
              </div>
            ) : (
              <div className="parking-history-box">
                <h2 className="content-title-table">History</h2>
                <table className="__table__">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parkingHistory.map((entry, index) => (
                      <tr key={index}>
                        <td>{entry.date}</td>
                        <td>{entry.time_in}</td>
                        <td>{entry.time_out}</td>
                        <td>{entry.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {editingField && (
          <div className="modal">
            <div className="modal-content">
              <h3 className="modal-title">
                Edit {editingField === "personal"
                  ? "Personal Info"
                  : editingField === "security"
                  ? "Security"
                  : "Vehicle Info"}
              </h3>
              <div className="modal-body">
                {editingField === "personal" && (
                  <>
                    <label>First Name:</label>
                    <input
                      type="text"
                      value={tempProfile.firstName || ""}
                      onChange={(e) => handleChange("firstName", e.target.value)}
                    />
                    <label>Last Name:</label>
                    <input
                      type="text"
                      value={tempProfile.lastName || ""}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                    />
                    <label>Email:</label>
                    <input
                      type="email"
                      value={tempProfile.email || ""}
                      onChange={(e) => handleChange("email", e.target.value)}
                    />
                  </>
                )}

                {editingField === "security" && (
                  <>
                    <label>Password:</label>
                    <input
                      type="password"
                      value={tempProfile.password || ""}
                      onChange={(e) => handleChange("password", e.target.value)}
                    />
                  </>
                )}

                {editingField === "vehicle" && (
                  <>
                    <label>Vehicle Type:</label>
                    <input
                      type="text"
                      value={tempProfile.vehicleType || ""}
                      onChange={(e) => handleChange("vehicleType", e.target.value)}
                    />
                    <label>Plate Number:</label>
                    <input
                      type="text"
                      value={tempProfile.plateNumber || ""}
                      onChange={(e) => handleChange("plateNumber", e.target.value)}
                    />
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button className="save-button" onClick={handleSave}>
                  Save
                </button>
                <button className="cancel-button" onClick={() => setEditingField(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default UserProfile;

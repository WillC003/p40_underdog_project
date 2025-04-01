import React, { useState, useEffect } from 'react';
import axios from 'axios';

function WalkersPage() {
  const [walkers, setWalkers] = useState([]);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [editingWalker, setEditingWalker] = useState(null);

  const API_URL = 'http://localhost:8000/walkers';

  const fetchWalkers = async () => {
    const response = await axios.get(API_URL);
    setWalkers(response.data);
  };

  useEffect(() => {
    fetchWalkers();
  }, []);

  const createWalker = async () => {
    if (!name || !phoneNumber) return alert('Please fill in all fields');
    await axios.post(API_URL, { name, phoneNumber });
    setName('');
    setPhoneNumber('');
    fetchWalkers();
  };

  const updateWalker = async () => {
    if (!name || !phoneNumber) return alert('Please fill in all fields');
    await axios.put(`${API_URL}/${editingWalker.id}`, { name, phoneNumber });
    setEditingWalker(null);
    setName('');
    setPhoneNumber('');
    fetchWalkers();
  };

  const deleteWalker = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
    fetchWalkers();
  };

  const handleEdit = (walker) => {
    setEditingWalker(walker);
    setName(walker.name);
    setPhoneNumber(walker.phoneNumber);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createWalker();
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Dog Walkers</h1>
      
      <section className="section">
        <h2>Add New Walker</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name:</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone:</label>
            <input
              type="tel"
              className="form-input"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Add Walker</button>
        </form>
      </section>

      <section className="section">
        <h2>Walkers List</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {walkers.map((walker) => (
                <tr key={walker.id}>
                  <td>{walker.name}</td>
                  <td>{walker.phoneNumber}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(walker)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => deleteWalker(walker.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editingWalker && (
        <div className="modal">
          <div className="modal-content section">
            <h2>Edit Walker</h2>
            <form onSubmit={updateWalker}>
              <div className="form-group">
                <label className="form-label">Name:</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone:</label>
                <input
                  type="tel"
                  className="form-input"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
              <div className="action-buttons">
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingWalker(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WalkersPage;

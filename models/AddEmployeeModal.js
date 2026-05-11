import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { baseURL } from "../../../Apiservices/Api";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../Shared/Navbar/Navbar";
import "./AddEmployeeModal.css";

const initialFormData = {
  // Information Tab Fields
  salutation: '',
  employee_name: '',
  employee_status: '',
  office_mail: '',
  office_mobile_number: '',
  employee_id: '',
  personal_mobile_number: '',
  designation: '',
  department: '',
  role: '',
  assignManager: '',
  reporting_to: '',
  fathers_name: '',
  dob: '',
  gender: '',
  marital_status: '',
  aadhar: '',
  pan: '',
  religion: '',
  blood_group: '',
  personal_email: '',
  ctc: '',
  gstin: '',
  emergency_contact: '',
  branch: '',
  uan_number: '',
  esi_number: '',
  date_of_joining: '',
  check_in_time: '',
  check_out_time: '',
  date_of_exit: '',
  password: '',
  upload_image: '', // Will store a base64 string if a file is uploaded

  // Address Tab Fields
  address_line_1: '',
  address_line_2: '',
  city: '',
  pincode: '',
  select_state: '',
  country: '',


  // Present Address Fields
  present_address_line_1: '',
  present_address_line_2: '',
  present_city: '',
  present_pincode: '',
  present_select_state: '',
  present_country: '',

  // Bank Tab Fields
  account_number: '',
  account_name: '',
  bank_name: '',
  ifsc_code: '',
  account_type: '',
  branch_name: ''
};

const EmployeeOnboarding = () => {
  const [activeTab, setActiveTab] = useState('information');
  const [formData, setFormData] = useState(initialFormData);
  const [sameAddress, setSameAddress] = useState(false);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // Generic onChange handler for text, select, email, date, etc.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handler for the checkbox to indicate permanent address is same as present address
  const handleSameAddressChange = (e) => {
    const isChecked = e.target.checked;
    setSameAddress(isChecked);

    if (isChecked) {
      // Copy permanent address values into present address fields
      setFormData(prevData => ({
        ...prevData,
        present_address_line_1: prevData.address_line_1,
        present_address_line_2: prevData.address_line_2,
        present_city: prevData.city,
        present_pincode: prevData.pincode,
        present_select_state: prevData.select_state,
        present_country: prevData.country
      }));
    } else {
      // Reset present address fields when unchecked
      setFormData(prevData => ({
        ...prevData,
        present_address_line_1: '',
        present_address_line_2: '',
        present_city: '',
        present_pincode: '',
        present_select_state: '',
        present_country: ''
      }));
    }
  };

  // Optional: Keep the present address in sync with permanent address if checkbox is checked
  useEffect(() => {
    if (sameAddress) {
      setFormData(prevData => ({
        ...prevData,
        present_address_line_1: prevData.address_line_1,
        present_address_line_2: prevData.address_line_2,
        present_city: prevData.city,
        present_pincode: prevData.pincode,
        present_select_state: prevData.select_state,
        present_country: prevData.country
      }));
    }
  }, [
    formData.address_line_1,
    formData.address_line_2,
    formData.city,
    formData.pincode,
    formData.select_state,
    formData.country,
    sameAddress
  ]);

  // Special handler for file upload (converts file to a base64 string)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prevData => ({
          ...prevData,
          upload_image: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to navigate tabs or submit when on the final tab
  const handleNext = () => {
    if (activeTab === 'information') {
      setActiveTab('address');
    } else if (activeTab === 'address') {
      setActiveTab('bank');
    } else if (activeTab === 'bank') {
      handleSubmit();
    }
  };

  const [managers, setManagers] = useState([]); // List of managers
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const response = await fetch(`${baseURL}/managers`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // JWT token
          },
        });
        const data = await response.json();

        if (response.ok) {
          setManagers(data.data || []); // Populate managers
        } else {
          throw new Error(data.message || "Failed to fetch managers.");
        }
      } catch (error) {
        setError(error.message);
      }
    };

    fetchManagers();
  }, []);


const handleSubmit = async () => {
  try {
    let payload = { ...formData };

    if (formData.role === "employee") {
      // Use loose equality so that type conversion happens automatically
      const selectedManager = managers.find(
        (manager) => manager.id == formData.assignManager
      );

      payload.managerid = formData.assignManager;
      payload.assign_manager = selectedManager ? selectedManager.name : "";

      delete payload.assignManager;
    }

    const response = await fetch(`${baseURL}/addmanager`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (response.ok) {
      alert(`Manager added successfully with id: ${data.id}`);
      setFormData(initialFormData);
      setActiveTab("information");
    } else {
      alert("Error: " + data.error);
    }
  } catch (err) {
    console.error("Error submitting form:", err);
    alert("Error submitting form: " + err.message);
  }
};

  

  return (
    <div className="salesViewLeadsContainer">
      <Navbar onToggleSidebar={setCollapsed} />
      <div className={`salesViewLeads ${collapsed ? "collapsed" : ""}`}>
        <div className="bg-light">
          <div className="form-container">
            <div className="form-header">
              <h2 className="h5 mb-0"><b>Employee Onboarding</b></h2>
              <span>Employee Onboarding</span>
            </div>
            <div className="p-3 p-md-4">
              {/* Navigation Tabs */}
              <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                  <a
                    className={`nav-link ${activeTab === 'information' ? 'active' : ''}`}
                    onClick={() => setActiveTab('information')}
                    style={{ cursor: 'pointer' }}
                  >
                    <b>Information</b>
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className={`nav-link ${activeTab === 'address' ? 'active' : ''}`}
                    onClick={() => setActiveTab('address')}
                    style={{ cursor: 'pointer' }}
                  >
                    <b>Address</b>
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className={`nav-link ${activeTab === 'bank' ? 'active' : ''}`}
                    onClick={() => setActiveTab('bank')}
                    style={{ cursor: 'pointer' }}
                  >
                    <b>Bank</b>
                  </a>
                </li>
              </ul>

              {/* Tab Contents */}
              <div className="tab-content">
                {/* Information Tab */}
                <div className={`tab-pane fade ${activeTab === 'information' ? 'show active' : ''}`} id="information">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label required"><b>Salutation</b></label>
                      <input type="text" className="form-control" name="salutation" value={formData.salutation} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label required"><b>Employee Name</b></label>
                      <input type="text" className="form-control" name="employee_name" value={formData.employee_name} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label required"><b>Employee Status</b></label>
                      <input type="text" className="form-control" name="employee_status" value={formData.employee_status} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label required"><b>Office mail</b></label>
                      <input type="email" className="form-control" name="office_mail" value={formData.office_mail} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label"><b>Office Mobile Number</b></label>
                      <input type="tel" className="form-control" name="office_mobile_number" value={formData.office_mobile_number} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label required"><b>Employee ID</b></label>
                      <input type="text" className="form-control" name="employee_id" value={formData.employee_id} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label required"><b>Personal Mobile Number</b></label>
                      <input type="tel" className="form-control" name="personal_mobile_number" value={formData.personal_mobile_number} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label"><b>Designation</b></label>
                      <input type="text" className="form-control" name="designation" value={formData.designation} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label"><b>Department</b></label>
                      <input type="text" className="form-control" name="department" value={formData.department} onChange={handleChange} />
                    </div>
                    <div className="addemployee-input-group col-md-6">
                      <label>Role</label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Role</option>
                        <option value="manager">Manager</option>
                        <option value="employee">Employee</option>
                      </select>
                    </div>
                    {formData.role === "employee" && (
                      <div className="addemployee-input-group col-md-6">
                        <label>Assign Manager</label>
                        <select
                          name="assignManager"
                          value={formData.assignManager}
                          onChange={handleChange}
                        >
                          <option value="">Select Manager</option>
                          {managers.map((manager) => (
                            <option key={manager.id} value={manager.id}>
                              {manager.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="col-md-6">
                      <label className="form-label"><b>Reporting To</b></label>
                      <input type="text" className="form-control" name="reporting_to" value={formData.reporting_to} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label"><b>Father's Name</b></label>
                      <input type="text" className="form-control" name="fathers_name" value={formData.fathers_name} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label required"><b>DOB</b></label>
                      <input type="date" className="form-control" name="dob" value={formData.dob} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label required"><b>Gender</b></label>
                      <select className="form-select" name="gender" value={formData.gender} onChange={handleChange}>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label"><b>Marital Status</b></label>
                      <select className="form-select" name="marital_status" value={formData.marital_status} onChange={handleChange}>
                        <option value="">Select Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label required"><b>Aadhar</b></label>
                      <input type="text" className="form-control" name="aadhar" value={formData.aadhar} onChange={handleChange} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label required"><b>PAN</b></label>
                      <input type="text" className="form-control" name="pan" value={formData.pan} onChange={handleChange} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label required"><b>Religion</b></label>
                      <input type="text" className="form-control" name="religion" value={formData.religion} onChange={handleChange} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label required"><b>Blood Group</b></label>
                      <input type="text" className="form-control" name="blood_group" value={formData.blood_group} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label"><b>Personal Email</b></label>
                      <input type="email" className="form-control" name="personal_email" value={formData.personal_email} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label"><b>CTC</b></label>
                      <input type="text" className="form-control" name="ctc" value={formData.ctc} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label"><b>GSTIN</b></label>
                      <input type="text" className="form-control" name="gstin" value={formData.gstin} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label required"><b>Emergency Contact</b></label>
                      <input type="tel" className="form-control" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label required"><b>Branch</b></label>
                      <div className="input-group">
                        <input type="text" className="form-control" name="branch" value={formData.branch} onChange={handleChange} />
                        {/* <span className="input-group-text add-branch">Add Branch</span> */}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label"><b>UAN Number</b></label>
                      <input type="text" className="form-control" name="uan_number" value={formData.uan_number} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label"><b>ESI Number</b></label>
                      <input type="text" className="form-control" name="esi_number" value={formData.esi_number} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label required"><b>Date of Joining</b></label>
                      <input type="date" className="form-control" name="date_of_joining" value={formData.date_of_joining} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label"><b>Check-in-time</b></label>
                      <input type="time" className="form-control" name="check_in_time" value={formData.check_in_time} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label"><b>Check-out-time</b></label>
                      <input type="time" className="form-control" name="check_out_time" value={formData.check_out_time} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label required"><b>Date of exit</b></label>
                      <input type="date" className="form-control" name="date_of_exit" value={formData.date_of_exit} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label required"><b>Password</b></label>
                      <input type="password" className="form-control" name="password" value={formData.password} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label required"><b>Upload Image</b></label>
                      <input type="file" className="form-control" name="upload_image" onChange={handleFileChange} />
                    </div>
                  </div>
                </div>

                <div
                  className={`tab-pane fade ${activeTab === 'address' ? 'show active' : ''}`}
                  id="address"
                >
                  <div className="address-type-toggle">
                    <div className="row g-2">
                      <div className="col-12">
                        <button className="btn btn-warning w-100" type="button">
                          <b>Permanent Address</b>
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Checkbox to indicate same address */}
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="sameAddress"
                      checked={sameAddress}
                      onChange={handleSameAddressChange}
                    />
                    <label className="form-check-label" htmlFor="sameAddress">
                      <b>Permanent address is same as Present address</b>
                    </label>
                  </div>

                  {/* Permanent Address Fields */}
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label"><b>Address line 1</b></label>
                      <input
                        type="text"
                        className="form-control"
                        name="address_line_1"
                        value={formData.address_line_1}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label"><b>Address line 2</b></label>
                      <input
                        type="text"
                        className="form-control"
                        name="address_line_2"
                        value={formData.address_line_2}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label"><b>City</b></label>
                      <input
                        type="text"
                        className="form-control"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label"><b>Pincode</b></label>
                      <input
                        type="text"
                        className="form-control"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label"><b>Select State</b></label>
                      <select
                        className="form-select"
                        name="select_state"
                        value={formData.select_state}
                        onChange={handleChange}
                      >
                        <option value="">Choose State</option>
                        <option value="State1">State1</option>
                        <option value="State2">State2</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label"><b>Country</b></label>
                      <select
                        className="form-select"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                      >
                        <option value="">Choose Country</option>
                        <option value="Country1">Country1</option>
                        <option value="Country2">Country2</option>
                      </select>
                    </div>
                  </div>

                  {/* Conditionally render the Present Address Fields only when checkbox is unchecked */}
                  {!sameAddress && (

                    <div className="row g-3 mt-4">
                      <div className="address-type-toggle">
                        <div className="row g-2">
                          {/* <div className="col-6">
                        <button className="btn btn-warning w-100" type="button">
                          <b>Permanent Address</b>
                        </button>
                      </div> */}
                          <div className="col-12">
                            <button className="btn btn-outline-warning w-100" type="button">
                              <b>Present Address</b>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="col-12">
                        <label className="form-label"><b>Present Address line 1</b></label>
                        <input
                          type="text"
                          className="form-control"
                          name="present_address_line_1"
                          value={formData.present_address_line_1}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label"><b>Present Address line 2</b></label>
                        <input
                          type="text"
                          className="form-control"
                          name="present_address_line_2"
                          value={formData.present_address_line_2}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label"><b>Present City</b></label>
                        <input
                          type="text"
                          className="form-control"
                          name="present_city"
                          value={formData.present_city}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label"><b>Present Pincode</b></label>
                        <input
                          type="text"
                          className="form-control"
                          name="present_pincode"
                          value={formData.present_pincode}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label"><b>Present Select State</b></label>
                        <select
                          className="form-select"
                          name="present_select_state"
                          value={formData.present_select_state}
                          onChange={handleChange}
                        >
                          <option value="">Choose State</option>
                          <option value="State1">State1</option>
                          <option value="State2">State2</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label"><b>Present Country</b></label>
                        <select
                          className="form-select"
                          name="present_country"
                          value={formData.present_country}
                          onChange={handleChange}
                        >
                          <option value="">Choose Country</option>
                          <option value="Country1">Country1</option>
                          <option value="Country2">Country2</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bank Tab */}
                <div className={`tab-pane fade ${activeTab === 'bank' ? 'show active' : ''}`} id="bank">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label"><b>Account Number</b></label>
                      <input type="text" className="form-control" name="account_number" value={formData.account_number} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label"><b>Account Name</b></label>
                      <input type="text" className="form-control" name="account_name" value={formData.account_name} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label"><b>Bank Name</b></label>
                      <input type="text" className="form-control" name="bank_name" value={formData.bank_name} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label"><b>IFSC Code</b></label>
                      <input type="text" className="form-control" name="ifsc_code" value={formData.ifsc_code} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label"><b>Account Type</b></label>
                      <select className="form-select" name="account_type" value={formData.account_type} onChange={handleChange}>
                        <option value="">Select Account Type</option>
                        <option value="Savings">Savings</option>
                        <option value="Current">Current</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label"><b>Branch Name</b></label>
                      <input type="text" className="form-control" name="branch_name" value={formData.branch_name} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              </div>
              {/* Navigation Buttons */}
              <div className="p-3 border-top text-end">
                <button className="btn btn-cancel me-2" type="button">Cancel</button>
                <button className="btn btn-submit" type="button" onClick={handleNext}>
                  {activeTab === 'bank' ? 'Submit' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};

export default EmployeeOnboarding;

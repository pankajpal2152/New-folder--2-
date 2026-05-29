import React, { useEffect, useState } from "react";
import "./Productdistibution.css"; 
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";
export default function Productdistibution() {
  // ====================================
  // STATE
  // ====================================

  const [formData, setFormData] = useState({
    ProId: "",
    ProName: "",
    MailId: "",
    Phone: "",
    Dept: "",
    Desig: "",
    Salary: "",
    states: [],
    districts: [],
    departments: [],
    jobTypes: [],
    StateId: "",
    DistId: "",
    JobTypeId: "",
    DeptId: "",
  });

  // State arrays for dropdowns and our table

  return (
    <div className="container mt-5">
      {/* <div className="card-header-custom card mb-4"> */}
      <div className="card shadow-lg  border-0 rounded-10">
        <div
          className="card-header text-white"
          style={{ background: "#696cff" }}
          // className="card-header-custom text-white" style={{background: "#696cff"}}
        >
          <h3>Product Transfer Information</h3>
        </div>
        <div className="col-md-12 mt-4">
          <p class="PerInfo">Sender Information:</p>
        </div>
        <div className="card-body">
          {/* FORM */}
          <form>
            <div className="row">
              <div class="row">
                <div className="col-md-4 mb-2">
                  <label className="form-label-custom">Account Head</label>
                  <select class="form-control form-control-sm">
                    name="DeptId" requiredname="DeptId"
                    <option value="">--Select Account Head--</option>
                  </select>
                </div>
                <div className="col-md-5 mb-2">
                  <label className="form-label-custom">Account Head Name</label>
                  <input
                    class="form-control form-control-sm"
                    aria-label=".form-control-sm example"
                    type="text"
                    type="text"
                    name="ProName"
                    placeholder="Account Head Name"
                    className="form-control"
                  />
                </div>
                <div className="col-md-2 mb-3">
                  <label className="form-label-custom">Transaction Date</label>
                  <input
                    class="form-control form-control-sm"
                    aria-label=".form-control-sm example"
                    type="date"
                    name="dob"
                    placeholder="Date of Birth"
                  ></input>
                </div>
              </div>
              <div class="row">
                <div className="col-md-5">
                  <label className="form-label-custom">Account Number</label>
                  <select class="form-control form-control-sm">
                    name="DeptId" requiredname="DeptId"
                    <option value="">--Select Account Number--</option>
                  </select>
                </div>
                <div className="col-md-7 mb-3">
                  <label className="form-label-custom">Account Name</label>
                  <input
                    type="text"
                    name="ProName"
                    placeholder="Account Name"
                    className="form-control"
                  />
                </div>
              </div>
              <div class="row">
                <div className="col-md-3 mb-2">
                  <label className="form-label-custom">Trasaction Mode</label>
                  <select class="form-control form-control-sm">
                    name="DeptId" requiredname="DeptId"
                    <option value="">--Select Transaction Mode--</option>
                  </select>
                </div>
                <div className="col-md-5 mb-2">
                  <label className="form-label-custom">Product Name</label>
                  <select class="form-control form-control-sm">
                    name="DeptId" requiredname="DeptId"
                    <option value="">--Select Product Name--</option>
                  </select>
                </div>

                <div className="col-md-2 mb-2">
                  <label className="form-label-custom">Transfer Quantity</label>
                  <input
                    type="text"
                    name="ProName"
                    placeholder="Transfer Quantity"
                    className="form-control"
                  />
                </div>
                <div className="col-md-2 mb-2">
                  <label className="form-label-custom">
                    Available Quantity
                  </label>
                  <input
                    type="text"
                    name="ProName"
                    placeholder="Available Quantity"
                    className="form-control"
                  />
                </div>
              </div>
              <div class="row">
                <p class="AddInfo">Receiver Information:</p>
              </div>
              <div class="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label-custom">Account Head</label>
                  <select class="form-control form-control-sm">
                    name="DeptId" requiredname="DeptId"
                    <option value="">--Select Account Head--</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label-custom">Account Head Name</label>
                  <input
                    class="form-control form-control-sm"
                    aria-label=".form-control-sm example"
                    type="text"
                    type="text"
                    name="ProName"
                    placeholder="Account Head Name"
                    className="form-control"
                  />
                </div>
              </div>
              <div class="row">
                <div className="col-md-5">
                  <label className="form-label-custom">Account Number</label>
                  <select class="form-control form-control-sm">
                    name="DeptId" requiredname="DeptId"
                    <option value="">--Select Account Number--</option>
                  </select>
                </div>
                <div className="col-md-7 mb-3">
                  <label className="form-label-custom">Account Name</label>
                  <input
                    class="form-control form-control-sm"
                    aria-label=".form-control-sm example"
                    type="text"
                    type="text"
                    name="ProName"
                    placeholder="Account Name"
                    className="form-control"
                  />
                </div>
              </div>
              <div class="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label-custom">Trasaction Mode</label>
                  <select class="form-control form-control-sm">
                    name="DeptId" requiredname="DeptId"
                    <option value="">--Select Transaction Mode--</option>
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label-custom">Receive Quantity</label>
                  <input
                    class="form-control form-control-sm"
                    aria-label=".form-control-sm example"
                    type="text"
                    name="ProName"
                    placeholder="Receive Quantity"
                    className="form-control"
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label-custom">
                    Available Quantity
                  </label>
                  <input
                    class="form-control form-control-sm"
                    aria-label=".form-control-sm example"
                    type="text"
                    name="ProName"
                    placeholder="Available Quantity"
                    className="form-control"
                  />
                </div>
              </div>
              <div class="row">
                <div className="col-md-12 mb-2">
                  <label className="form-label-custom">Remerks</label>
                  <textarea
                    className="textarea"
                    className="form-control"
                    id="exampleFormControlTextarea1"
                    rows="2"
                    name="ProName"
                    placeholder="Remarks"
                    class="form-control form-control-sm"
                    aria-label=".form-control-sm example"
                  />
                </div>
              </div>
              <div className="col-md-12">
                <button className="btn btn-primary">Submit</button>
              </div>
            </div>
          </form>

          {/* TABLE */}
          <div className="table-responsive mt-5">
            <table className="custom-table table-sm">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Salary</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {/* {professors.map((item) => (
                  <tr >
                    <td></td>

                    <td></td>

                    <td></td>

                    <td></td>

                    <td></td>

                    <td>₹ </td>

                    <td>
                      <button
                        className="btn btn-info btn-sm me-2"
                       
                      >
                        <FaEye />
                      </button>
                      <button
                        className="btn btn-warning btn-sm me-2"
                      
                      >
                        <FaEdit />
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                       
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))} */}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

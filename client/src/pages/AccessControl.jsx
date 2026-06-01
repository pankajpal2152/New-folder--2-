import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { styles, FormInput } from "../config/constants";
import { PasswordInput } from "../components/AccountSharedUtils";

// ✅ Import the newly created CSS file
import "./AccessControl.css";

// ==========================================
// 1. VALIDATION SCHEMA
// ==========================================
const accessSchema = z.object({
  acctHead: z.object(
    { value: z.any(), label: z.string() },
    { required_error: "Please select an Account Head (Role)" },
  ),

  stateNgo: z
    .object({
      value: z.any(),
      label: z.string(),
      stateName: z.string(),
      distName: z.string(),
    })
    .nullable()
    .optional(),
  distNgo: z
    .object({ value: z.any(), label: z.string() })
    .nullable()
    .optional(),
  supervisor: z
    .object({ value: z.any(), label: z.string() })
    .nullable()
    .optional(),
  asthaDidi: z
    .object({ value: z.any(), label: z.string() })
    .nullable()
    .optional(),

  state: z.object(
    { value: z.any(), label: z.string() },
    { required_error: "State is required" },
  ),
  district: z.object(
    { value: z.any(), label: z.string() },
    { required_error: "District is required" },
  ),
  entityName: z.string().optional(),
  acctName: z.string().min(2, "Account Name is required"),

  userName: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const AccessControl = () => {
  // ==========================================
  // 2. STATE
  // ==========================================
  const [dbAcctHeads, setDbAcctHeads] = useState([]);
  const [dbStateNgos, setDbStateNgos] = useState([]);
  const [dbDistNgos, setDbDistNgos] = useState([]);
  const [dbSupervisors, setDbSupervisors] = useState([]);
  const [dbAsthaDidis, setDbAsthaDidis] = useState([]);
  const [dbStates, setDbStates] = useState([]);
  const [dbDistricts, setDbDistricts] = useState([]);

  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [selectedDistricts, setSelectedDistricts] = useState([]);

  const [accessRecords, setAccessRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(accessSchema),
    mode: "onChange",
    defaultValues: {
      acctHead: null,
      stateNgo: null,
      distNgo: null,
      supervisor: null,
      asthaDidi: null,
      state: null,
      district: null,
      entityName: "",
      acctName: "",
      userName: "",
      password: "",
    },
  });

  const watchedRole = watch("acctHead");
  const watchedStateNgo = watch("stateNgo");

  const roleValue = watchedRole?.value;
  const showStateNgo =
    roleValue === "DIST_ADMIN" ||
    roleValue === "SUPERVISOR" ||
    roleValue === "ASTHA_DIDI" ||
    roleValue === "ASTHA_MAA";
  const showDistNgo =
    roleValue === "SUPERVISOR" ||
    roleValue === "ASTHA_DIDI" ||
    roleValue === "ASTHA_MAA";
  const showSupervisor =
    roleValue === "ASTHA_DIDI" || roleValue === "ASTHA_MAA";
  const showAsthaDidi = roleValue === "ASTHA_MAA";
  const showEntityName = roleValue === "DIST_ADMIN";

  // ==========================================
  // 3. INITIALIZATION (NO DUMMY DATA)
  // ==========================================
  useEffect(() => {
    // You can leave roles hardcoded or fetch them from `/api/userinfo`
    setDbAcctHeads([
      { value: "DIST_ADMIN", label: "District Administrator" },
      { value: "SUPERVISOR", label: "Supervisor" },
      { value: "ASTHA_DIDI", label: "Astha Didi" },
      { value: "ASTHA_MAA", label: "Astha Maa" },
    ]);

    // TODO: FETCH FROM DATABASE HERE (Dummy data removed)
    // fetch('/api/motherngos').then(res => res.json()).then(data => setDbStateNgos(data));
    // fetch('/api/states').then(res => res.json()).then(data => setDbStates(data));
    // ... etc ...

    setDbStateNgos([]);
    setDbDistNgos([]);
    setDbSupervisors([]);
    setDbAsthaDidis([]);
    setDbStates([]);
    setDbDistricts([]);
    setAvailableDistricts([]);
    setAccessRecords([]);
  }, []);

  // ==========================================
  // 4. TABLE SORTING & FILTERING
  // ==========================================
  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredRecords = useMemo(() => {
    let filtered = accessRecords;
    if (searchTerm.trim()) {
      const lowercasedSearch = searchTerm.toLowerCase();
      filtered = accessRecords.filter((record) =>
        Object.values(record).some(
          (val) =>
            val && val.toString().toLowerCase().includes(lowercasedSearch),
        ),
      );
    }

    if (sortConfig.key !== null) {
      filtered.sort((a, b) => {
        const valA = a[sortConfig.key] || "";
        const valB = b[sortConfig.key] || "";
        if (valA < valB) return sortConfig.direction === "ascending" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [accessRecords, searchTerm, sortConfig]);

  const renderSortIcon = (columnName) => {
    if (sortConfig.key !== columnName)
      return (
        <span className="ms-1 text-muted" style={{ fontSize: "12px" }}>
          ↕
        </span>
      );
    if (sortConfig.direction === "ascending")
      return (
        <span className="ms-1 text-primary" style={{ fontSize: "14px" }}>
          ↑
        </span>
      );
    return (
      <span className="ms-1 text-primary" style={{ fontSize: "14px" }}>
        ↓
      </span>
    );
  };

  // ==========================================
  // 5. EVENT HANDLERS
  // ==========================================
  const handleDistrictToggle = (district) => {
    setSelectedDistricts((prev) =>
      prev.includes(district)
        ? prev.filter((d) => d !== district)
        : [...prev, district],
    );
  };

  const handleSelectAllDistricts = () => {
    setSelectedDistricts(
      selectedDistricts.length === availableDistricts.length
        ? []
        : [...availableDistricts],
    );
  };

  const handleResetForm = () => {
    reset();
    setSelectedDistricts([]);
  };

  const onSubmit = (data) => {
    if (
      selectedDistricts.length === 0 &&
      (roleValue === "DIST_ADMIN" || roleValue === "SUPERVISOR")
    ) {
      toast.warning(
        "Please assign at least one district access permission in the matrix.",
      );
      return;
    }

    const finalPayload = {
      ...data,
      motherNgoState: watchedStateNgo?.stateName || null,
      motherNgoDistrict: watchedStateNgo?.distName || null,
      assignedDistricts: selectedDistricts,
    };

    console.log("🚀 READY TO SEND TO DB:", finalPayload);
    toast.success(`Access Rule Created for ${watchedRole.label}!`);
    handleResetForm();
  };

  const onError = () => {
    toast.error("Please fill in all required red fields.");
  };

  // ✅ FIXED: Added menuPortalTarget and zIndex to ensure dropdown breaks out of containers
  const customSelectStyles = (hasError) => ({
    control: (base) => ({
      ...base,
      minHeight: "31px",
      height: "31px",
      fontSize: "0.875rem",
      borderColor: hasError ? "#dc3545" : "#ced4da",
      boxShadow: "none",
      "&:hover": { borderColor: hasError ? "#dc3545" : "#86b7fe" },
    }),
    valueContainer: (base) => ({ ...base, padding: "0 8px" }),
    input: (base) => ({ ...base, margin: 0, padding: 0 }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base) => ({ ...base, padding: "4px" }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }), // Forces dropdown above everything
  });

  return (
    <div className="emp-wrapper">
      <ToastContainer autoClose={3000} pauseOnHover={false} />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2
            className="fw-bold mb-0 text-dark"
            style={{ fontSize: "1.75rem" }}
          >
            Access Control Manager
          </h2>
          <p className="text-muted mb-0">Role & Permission Configuration</p>
        </div>
      </div>

      <div className="emp-card">
        <div className="emp-card-header">
          <h5 className="mb-0 fw-bold d-flex align-items-center">
            <span className="me-2">🔐</span> Registration & Permission Form
          </h5>
        </div>

        <div className="emp-card-body">
          <form
            id="accessForm"
            onSubmit={handleSubmit(onSubmit, onError)}
            className="row g-3"
          >
            <div className="col-md-4">
              <label className="emp-label">
                Create Role<span className="text-danger">*</span>
              </label>
              <Controller
                name="acctHead"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={dbAcctHeads}
                    placeholder="Select Role..."
                    styles={customSelectStyles(!!errors.acctHead)}
                    menuPortalTarget={document.body}
                    menuPosition={"fixed"}
                  />
                )}
              />
              {errors.acctHead && (
                <p className="error-text">{errors.acctHead.message}</p>
              )}
            </div>

            {watchedRole && (
              <>
                <div className="col-12">
                  <p className="PerInfo">1. Parent Organization Context</p>
                </div>

                {showStateNgo && (
                  <>
                    <div className="col-md-4">
                      <label className="emp-label">
                        State NGO<span className="text-danger">*</span>
                      </label>
                      <Controller
                        name="stateNgo"
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            options={dbStateNgos}
                            placeholder="Select Mother NGO..."
                            styles={customSelectStyles(false)}
                            isClearable
                            menuPortalTarget={document.body}
                            menuPosition={"fixed"}
                          />
                        )}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="emp-label">NGO State</label>
                      <input
                        type="text"
                        className="form-control form-control-sm bg-light text-muted"
                        value={watchedStateNgo ? watchedStateNgo.stateName : ""}
                        placeholder="Auto-fetched..."
                        readOnly
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="emp-label">NGO District</label>
                      <input
                        type="text"
                        className="form-control form-control-sm bg-light text-muted"
                        value={watchedStateNgo ? watchedStateNgo.distName : ""}
                        placeholder="Auto-fetched..."
                        readOnly
                      />
                    </div>
                  </>
                )}

                {showDistNgo && (
                  <div className="col-md-4">
                    <label className="emp-label">
                      District NGO <span className="text-danger">*</span>
                    </label>
                    <Controller
                      name="distNgo"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          options={dbDistNgos}
                          placeholder="Select Dist NGO..."
                          styles={customSelectStyles(false)}
                          isClearable
                          menuPortalTarget={document.body}
                          menuPosition={"fixed"}
                        />
                      )}
                    />
                  </div>
                )}

                {showSupervisor && (
                  <div className="col-md-4">
                    <label className="emp-label">
                      Supervisor <span className="text-danger">*</span>
                    </label>
                    <Controller
                      name="supervisor"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          options={dbSupervisors}
                          placeholder="Select Supervisor..."
                          styles={customSelectStyles(false)}
                          isClearable
                          menuPortalTarget={document.body}
                          menuPosition={"fixed"}
                        />
                      )}
                    />
                  </div>
                )}

                {showAsthaDidi && (
                  <div className="col-md-4">
                    <label className="emp-label">
                      Astha Didi <span className="text-danger">*</span>
                    </label>
                    <Controller
                      name="asthaDidi"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          options={dbAsthaDidis}
                          placeholder="Select Astha Didi..."
                          styles={customSelectStyles(false)}
                          isClearable
                          menuPortalTarget={document.body}
                          menuPosition={"fixed"}
                        />
                      )}
                    />
                  </div>
                )}
              </>
            )}

            {watchedRole && (
              <>
                <div className="col-12">
                  <p className="PerInfo" style={{ backgroundColor: "#659EC7" }}>
                    2. Assign Location
                  </p>
                </div>

                <div className="col-md-3">
                  <label className="emp-label">
                    State <span className="text-danger">*</span>
                  </label>
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={dbStates}
                        placeholder="Select State..."
                        styles={customSelectStyles(!!errors.state)}
                        isClearable
                        menuPortalTarget={document.body}
                        menuPosition={"fixed"}
                      />
                    )}
                  />
                  {errors.state && (
                    <p className="error-text">{errors.state.message}</p>
                  )}
                </div>

                <div className="col-md-3">
                  <label className="emp-label">
                    District <span className="text-danger">*</span>
                  </label>
                  <Controller
                    name="district"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={dbDistricts}
                        placeholder="Select District..."
                        styles={customSelectStyles(!!errors.district)}
                        isClearable
                        menuPortalTarget={document.body}
                        menuPosition={"fixed"}
                      />
                    )}
                  />
                  {errors.district && (
                    <p className="error-text">{errors.district.message}</p>
                  )}
                </div>

                {showEntityName && (
                  <div className="col-md-3">
                    <label className="emp-label">
                      District NGO Name <span className="text-danger">*</span>
                    </label>
                    <Controller
                      name="entityName"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="text"
                          className={`form-control form-control-sm ${errors.entityName ? "is-invalid" : ""}`}
                          placeholder="Enter NGO Name"
                          {...field}
                        />
                      )}
                    />
                    {errors.entityName && (
                      <p className="error-text">{errors.entityName.message}</p>
                    )}
                  </div>
                )}

                {/* <div className="col-md-3">
                                    <label className="emp-label">Account Name (Person) <span className="text-danger">*</span></label>
                                    <Controller name="acctName" control={control} render={({ field }) => (
                                        <input type="text" className={`form-control form-control-sm ${errors.acctName ? 'is-invalid' : ''}`} placeholder="Enter Person's Name" {...field} />
                                    )} />
                                    {errors.acctName && <p className="error-text">{errors.acctName.message}</p>}
                                </div> */}
              </>
            )}

            {watchedRole && (
              <>
                <div className="col-12">
                  <p className="PerInfo" style={{ backgroundColor: "#BAB86C" }}>
                    3. Login Access Credentials
                  </p>
                </div>
                <div className="col-md-4">
                  <label className="emp-label">
                    User Name (For Login) <span className="text-danger">*</span>
                  </label>
                  <Controller
                    name="userName"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="text"
                        autoComplete="off"
                        className={`form-control form-control-sm ${errors.userName ? "is-invalid" : ""}`}
                        placeholder="Enter username"
                        {...field}
                      />
                    )}
                  />
                  {errors.userName && (
                    <p className="error-text">{errors.userName.message}</p>
                  )}
                </div>
                <div className="col-md-4">
                  <label className="emp-label">
                    Password <span className="text-danger">*</span>
                  </label>
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="password"
                        autoComplete="new-password"
                        className={`form-control form-control-sm ${errors.password ? "is-invalid" : ""}`}
                        placeholder="Set secure password"
                        {...field}
                      />
                    )}
                  />
                  {errors.password && (
                    <p className="error-text">{errors.password.message}</p>
                  )}
                </div>
              </>
            )}

            {watchedRole &&
              (roleValue === "DIST_ADMIN" || roleValue === "SUPERVISOR") && (
                <div className="col-12">
                  {/* <div className="matrix-container">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div>
                                            <h6 className="fw-bold mb-1" style={{ color: '#0E87CC' }}>4. Data Visibility (Permission Matrix)</h6>
                                            <small className="text-muted">Select which districts this user is allowed to access and manage below them.</small>
                                        </div>
                                        <button type="button" onClick={handleSelectAllDistricts} className="btn btn-sm btn-outline-primary">
                                            {selectedDistricts.length === availableDistricts.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="row g-2">
                                        {availableDistricts.map(district => (
                                            <div key={district} className="col-6 col-md-3 col-lg-2">
                                                <div className={`form-check p-2 rounded border ${selectedDistricts.includes(district) ? 'bg-primary bg-opacity-10 border-primary' : 'bg-white'}`}>
                                                    <input 
                                                        className="form-check-input ms-1 cursor-pointer" 
                                                        type="checkbox" 
                                                        id={`chk-${district}`}
                                                        checked={selectedDistricts.includes(district)}
                                                        onChange={() => handleDistrictToggle(district)}
                                                    />
                                                    <label className="form-check-label ms-2 cursor-pointer w-100" htmlFor={`chk-${district}`} style={{fontSize: '0.85rem', fontWeight: '500'}}>
                                                        {district}
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div> */}
                </div>
              )}
          </form>
        </div>

        {watchedRole && (
          <div className="emp-card-footer">
            <button
              type="button"
              className="btn btn-secondary px-4 shadow-sm"
              onClick={handleResetForm}
            >
              Clear Form
            </button>
            <button
              type="submit"
              form="accessForm"
              className="btn btn-primary px-5 shadow-sm fw-bold"
            >
              Save Access Rule
            </button>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* TABLE SECTION */}
      {/* ========================================== */}
      <div className="emp-card mt-4">
        <div className="emp-card-header bg-dark">
          <h5 className="mb-0 fw-bold text-white d-flex align-items-center">
            <span className="me-2">📋</span> Registered Access Directory
          </h5>
        </div>

        <div className="emp-card-body p-0">
          <div className="p-3 border-bottom d-flex justify-content-end bg-light">
            <div className="position-relative" style={{ width: "300px" }}>
              <span
                className="position-absolute text-muted"
                style={{
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                🔍
              </span>
              <input
                type="text"
                className="form-control form-control-sm ps-5"
                placeholder="Search all records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 bg-white">
              <thead
                className="table-light text-uppercase"
                style={{ fontSize: "0.85rem" }}
              >
                <tr>
                  <th
                    className="py-3 ps-4 cursor-pointer sortable-header"
                    onClick={() => handleSort("role")}
                  >
                    Role {renderSortIcon("role")}
                  </th>
                  <th
                    className="py-3 cursor-pointer sortable-header"
                    onClick={() => handleSort("motherNgo")}
                  >
                    Mother NGO {renderSortIcon("motherNgo")}
                  </th>
                  <th
                    className="py-3 cursor-pointer sortable-header"
                    onClick={() => handleSort("distNgo")}
                  >
                    District NGO {renderSortIcon("distNgo")}
                  </th>
                  <th
                    className="py-3 cursor-pointer sortable-header"
                    onClick={() => handleSort("state")}
                  >
                    State {renderSortIcon("state")}
                  </th>
                  <th
                    className="py-3 cursor-pointer sortable-header"
                    onClick={() => handleSort("district")}
                  >
                    Assigned District(s) {renderSortIcon("district")}
                  </th>
                  <th
                    className="py-3 cursor-pointer sortable-header"
                    onClick={() => handleSort("acctName")}
                  >
                    Account Name {renderSortIcon("acctName")}
                  </th>
                  <th
                    className="py-3 pe-4 cursor-pointer sortable-header"
                    onClick={() => handleSort("userName")}
                  >
                    Username {renderSortIcon("userName")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFilteredRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-5 text-muted fw-bold"
                    >
                      {searchTerm
                        ? "No records match your search criteria."
                        : "No access records found in database."}
                    </td>
                  </tr>
                ) : (
                  sortedAndFilteredRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="ps-4 text-primary fw-bold">
                        {record.role}
                      </td>
                      <td className="text-dark">{record.motherNgo}</td>
                      <td className="text-dark">{record.distNgo}</td>
                      <td className="text-dark">{record.state}</td>
                      <td>
                        {record.district.includes(",") ? (
                          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                            {record.district} (Multiple)
                          </span>
                        ) : (
                          <span className="text-dark">{record.district}</span>
                        )}
                      </td>
                      <td className="fw-bold">{record.acctName}</td>
                      <td className="pe-4 text-muted">{record.userName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessControl;

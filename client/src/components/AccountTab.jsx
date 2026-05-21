import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { styles, API_BASE_URL } from "../config/constants";
import { getSafeUser } from "./AccountSharedUtils";

import DistrictAdminForm from "./forms/DistrictAdminForm";
import SupervisorForm from "./forms/SupervisorForm";
import AsthaMaaForm from "./forms/AsthaMaaForm";
import AsthaDidiForm from "./forms/AsthaDidiForm";

import DistrictAdminTable from "./DistrictAdminTable";
import SupervisorTable from "./SupervisorTable";
import AsthaMaaTable from "./AsthaMaaTable";
import MembersTable from "./AsthaDidiTable";

const AccountTab = () => {
  const [appUserRole, setAppUserRole] = useState(null);
  const [loggedInProfileId, setLoggedInProfileId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [adminActiveView, setAdminActiveView] = useState("");

  const [filterMotherNgo, setFilterMotherNgo] = useState(null);
  const [filterState, setFilterState] = useState(null);
  const [filterDistrict, setFilterDistrict] = useState(null);
  const [filterSupervisor, setFilterSupervisor] = useState(null);
  const [filterAsthaDidi, setFilterAsthaDidi] = useState(null);

  const [dbMotherNgos, setDbMotherNgos] = useState([]);
  const [dbStates, setDbStates] = useState([]);
  const [dbDistricts, setDbDistricts] = useState([]);
  const [dbSupervisors, setDbSupervisors] = useState([]);
  const [dbAsthaDidis, setDbAsthaDidis] = useState([]);

  const isLockedRole = appUserRole === "District Administrator" || appUserRole === "Supervisor";

  useEffect(() => {
    const user = getSafeUser();
    if (user) {
      const role = user.role || user.UserSignUpRole || "";
      setAppUserRole(role);
      setLoggedInProfileId(user.ProfileRegId);

      if (role === "State Super Administrator" || role.toLowerCase() === "developer") {
        setAdminActiveView("District Administrator");
      } else if (role === "District Administrator") {
        setAdminActiveView("Supervisor");
      } else if (role === "Supervisor") {
        setAdminActiveView("Astha Didi");
      } else {
        setAdminActiveView("Astha Maa");
      }
    } else {
      setAppUserRole("Guest");
      setAdminActiveView("Guest");
    }

    fetch(`${API_BASE_URL}/states`).then(res => res.json()).then(data => setDbStates(data.map(s => ({ value: s.StateId, label: s.StateName }))));
    fetch(`${API_BASE_URL}/districtadmin`).then(res => res.json()).then(data => setDbMotherNgos(data.map(n => ({ value: n.DistNGORegId, label: n.DistNGOName, districtName: n.DistNGODistName, stateName: n.DistNGOStateName }))));
    fetch(`${API_BASE_URL}/supervisor`).then(res => res.json()).then(data => setDbSupervisors(data.map(s => ({ value: s.SupRegId, label: s.SupName, userSignUpId: s.UserSignUpId || s.SupRegId, stateName: s.SupStateName, distName: s.SupDistName, motherNgoId: s.DistNGORegId }))));
    fetch(`${API_BASE_URL}/asthadidi`).then(res => res.json()).then(data => setDbAsthaDidis(data.map(a => ({ value: a.AsthaDidiRegId, label: a.AsthaDidiUserName, stateName: a.AsthaDidiStateName, distName: a.AsthaDidiDistName, motherNgoId: a.DistNGORegId, supRegId: a.SupRegId, createdByAuthRegId: a.AsthaDidiCreatedByAuthRegId }))));
  }, []);

  useEffect(() => {
    if (filterState?.value) {
      fetch(`${API_BASE_URL}/districts/${filterState.value}`).then(res => res.json()).then(data => setDbDistricts(data.map(d => ({ value: d.DistId, label: d.DistName }))));
    } else { setDbDistricts([]); }
  }, [filterState]);

  const filteredMotherNgos = useMemo(() => dbMotherNgos, [dbMotherNgos]);
  const filteredStateOptions = useMemo(() => dbStates, [dbStates]);
  const filteredDistrictOptions = useMemo(() => dbDistricts, [dbDistricts]);
  
  const filteredSupervisorOptions = useMemo(() => {
    return dbSupervisors.filter(sup => 
      (!filterMotherNgo || String(sup.motherNgoId) === String(filterMotherNgo.value)) &&
      (!filterState || sup.stateName?.toLowerCase() === filterState.label.toLowerCase()) &&
      (!filterDistrict || sup.distName?.toLowerCase() === filterDistrict.label.toLowerCase())
    );
  }, [dbSupervisors, filterMotherNgo, filterState, filterDistrict]);

  const filteredAsthaDidiOptions = useMemo(() => {
    return dbAsthaDidis.filter(ad => 
      (!filterMotherNgo || String(ad.motherNgoId) === String(filterMotherNgo.value)) &&
      (!filterState || ad.stateName?.toLowerCase() === filterState.label.toLowerCase()) &&
      (!filterDistrict || ad.distName?.toLowerCase() === filterDistrict.label.toLowerCase()) &&
      (!filterSupervisor || String(ad.supRegId) === String(filterSupervisor.value) || String(ad.createdByAuthRegId) === String(filterSupervisor.userSignUpId))
    );
  }, [dbAsthaDidis, filterMotherNgo, filterState, filterDistrict, filterSupervisor]);

  const handleReset = (level) => {
    if (level <= 1) setFilterMotherNgo(null);
    if (level <= 2) setFilterState(null);
    if (level <= 3) setFilterDistrict(null);
    if (level <= 4) setFilterSupervisor(null);
    if (level <= 5) setFilterAsthaDidi(null);
  };

  const handleFormSuccess = () => setRefreshTrigger((prev) => prev + 1);

  if (appUserRole === null) return <div style={{ padding: "24px" }}>Loading Interface...</div>;

  const adminOptions = [
    { value: "District Administrator", label: "District Administrator" },
    { value: "Supervisor", label: "Supervisor" },
    { value: "Astha Didi", label: "Astha Didi" },
    { value: "Astha Maa", label: "Astha Maa" },
  ].filter(o => {
    if (appUserRole === "District Administrator") return ["Supervisor", "Astha Didi", "Astha Maa"].includes(o.value);
    if (appUserRole === "Supervisor") return ["Astha Didi", "Astha Maa"].includes(o.value);
    return true;
  });

  return (
    <>
      <ToastContainer autoClose={3000} />
      <div style={{ ...styles.card, padding: "24px", marginBottom: "24px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ width: "250px" }}>
          <label style={{ ...styles.label, marginBottom: "8px", display: "block" }}>Select Role *</label>
          <Select options={adminOptions} value={adminOptions.find(o => o.value === adminActiveView)} onChange={(s) => { setAdminActiveView(s.value); handleReset(0); }} isSearchable={false} />
        </div>
        
        {/* Simplified Filters for display */}
        <div style={{ width: "200px" }}><label style={styles.label}>NGO</label><Select options={filteredMotherNgos} value={filterMotherNgo} onChange={(s) => { setFilterMotherNgo(s); handleReset(1); }} isClearable /></div>
        <div style={{ width: "150px" }}><label style={styles.label}>State</label><Select options={filteredStateOptions} value={filterState} onChange={(s) => { setFilterState(s); handleReset(2); }} isClearable /></div>
        <div style={{ width: "150px" }}><label style={styles.label}>District</label><Select options={filteredDistrictOptions} value={filterDistrict} onChange={(s) => { setFilterDistrict(s); handleReset(3); }} isClearable /></div>
        
        {appUserRole !== "Supervisor" && (
          <div style={{ width: "200px" }}><label style={styles.label}>Supervisor</label><Select options={filteredSupervisorOptions} value={filterSupervisor} onChange={(s) => { setFilterSupervisor(s); handleReset(4); }} isClearable /></div>
        )}
        
        {["Astha Maa"].includes(adminActiveView) && (
            <div style={{ width: "200px" }}><label style={styles.label}>Astha Didi</label><Select options={filteredAsthaDidiOptions} value={filterAsthaDidi} onChange={setFilterAsthaDidi} isClearable /></div>
        )}
      </div>

      {adminActiveView === "District Administrator" ? (
        <><DistrictAdminForm onSuccess={handleFormSuccess} /><DistrictAdminTable refreshTrigger={refreshTrigger} externalFilters={{ filterState, filterDistrict }} /></>
      ) : adminActiveView === "Supervisor" ? (
        <><SupervisorForm onSuccess={handleFormSuccess} externalFilters={{ filterMotherNgo, filterState, filterDistrict }} /><SupervisorTable refreshTrigger={refreshTrigger} externalFilters={{ filterMotherNgo, filterState, filterDistrict }} /></>
      ) : adminActiveView === "Astha Maa" ? (
        <><AsthaMaaForm onSuccess={handleFormSuccess} externalFilters={{ filterMotherNgo, filterState, filterDistrict, filterSupervisor, filterAsthaDidi }} /><AsthaMaaTable refreshTrigger={refreshTrigger} externalFilters={{ filterMotherNgo, filterState, filterDistrict, filterSupervisor, filterAsthaDidi }} /></>
      ) : (
        <><AsthaDidiForm onSuccess={handleFormSuccess} externalFilters={{ filterMotherNgo, filterState, filterDistrict, filterSupervisor }} /><MembersTable refreshTrigger={refreshTrigger} externalFilters={{ filterMotherNgo, filterState, filterDistrict, filterSupervisor }} /></>
      )}
    </>
  );
};
export default AccountTab;
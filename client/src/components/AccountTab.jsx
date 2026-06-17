import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { styles, API_BASE_URL } from "../config/constants";
import { getSafeUser } from "./AccountSharedUtils";

// Import Forms
import StateSuperAdminForm from "./forms/StateSuperAdminForm";
import DistrictAdminForm from "./forms/DistrictAdminForm";
import SupervisorForm from "./forms/SupervisorForm";
import AsthaMaaForm from "./forms/AsthaMaaForm";
import AsthaDidiForm from "./forms/AsthaDidiForm";

// Import Split Tables
import StateSuperAdminTable from "./StateSuperAdminTable";
import DistrictAdminTable from "./DistrictAdminTable";
import SupervisorTable from "./SupervisorTable";
import AsthaMaaTable from "./AsthaMaaTable";
import MembersTable from "./AsthaDidiTable";

const AccountTab = () => {
  const [appUserRole, setAppUserRole] = useState(null);
  const [loggedInProfileId, setLoggedInProfileId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [adminActiveView, setAdminActiveView] = useState("");

  const [filterNationalNgo, setFilterNationalNgo] = useState(null);
  const [filterStateNgo, setFilterStateNgo] = useState(null);
  const [filterMotherNgo, setFilterMotherNgo] = useState(null);
  const [filterState, setFilterState] = useState(null);
  const [filterDistrict, setFilterDistrict] = useState(null);
  const [filterSupervisor, setFilterSupervisor] = useState(null);
  const [filterAsthaDidi, setFilterAsthaDidi] = useState(null);

  const [dbNationalNgos, setDbNationalNgos] = useState([]);
  const [dbStateNgos, setDbStateNgos] = useState([]);
  const [dbMotherNgos, setDbMotherNgos] = useState([]);
  const [dbStates, setDbStates] = useState([]);
  const [dbDistricts, setDbDistricts] = useState([]);
  const [dbSupervisors, setDbSupervisors] = useState([]);
  const [dbAsthaDidis, setDbAsthaDidis] = useState([]);

  useEffect(() => {
    const user = getSafeUser();
    let currentRole = "";
    let currentNationalNgoOption = null;

    if (user) {
      const role = user.role || user.UserSignUpRole || "";
      currentRole = role;
      setAppUserRole(role);
      setLoggedInProfileId(user.ProfileRegId);

      if (role === "National NGO") {
        currentNationalNgoOption = {
          value: user.AcctId || user.ProfileRegId || user.id,
          label:
            user.SignupUserName ||
            user.username ||
            user.UserSignUpEmail ||
            "National NGO",
        };
        if (currentNationalNgoOption.value) {
          setDbNationalNgos([currentNationalNgoOption]);
          setFilterNationalNgo(currentNationalNgoOption);
        }
      }

      if (role === "National NGO") {
        setAdminActiveView("State Super Administrator");
      } else if (
        role === "State Super Administrator" ||
        role.toLowerCase() === "developer"
      ) {
        setAdminActiveView("District Administrator");
      } else if (role === "District Administrator") {
        setAdminActiveView("Supervisor");
      } else if (role === "Supervisor") {
        setAdminActiveView("Astha Didi");
      } else if (role === "Astha Didi") {
        setAdminActiveView("Astha Maa");
      } else if (role === "Astha Maa") {
        setAdminActiveView("Astha Maa");
      } else {
        setAdminActiveView("Astha Didi");
      }
    } else {
      setAppUserRole("Guest");
      setAdminActiveView("Guest");
    }

    fetch(`${API_BASE_URL}/nationalngo`)
      .then((res) => res.json())
      .then((data) => {
        const options = data.map((ngo) => ({
          value: ngo.AcctId,
          label: ngo.DisplayName || ngo.AcctName || ngo.SignupEmail,
          acctHead: ngo.AcctHead,
          acctNo: ngo.AcctNo,
        }));

        if (currentRole === "National NGO") {
          const lockedOption =
            options.find(
              (option) =>
                String(option.value) ===
                String(currentNationalNgoOption?.value),
            ) || currentNationalNgoOption;
          if (lockedOption) {
            setDbNationalNgos([lockedOption]);
            setFilterNationalNgo(lockedOption);
          }
          return;
        }

        setDbNationalNgos(options);
      })
      .catch(() => {
        if (currentNationalNgoOption) {
          setDbNationalNgos([currentNationalNgoOption]);
          setFilterNationalNgo(currentNationalNgoOption);
        }
      });

    fetch(`${API_BASE_URL}/states`)
      .then((res) => res.json())
      .then((data) =>
        setDbStates(
          data.map((s) => ({ value: s.StateId, label: s.StateName })),
        ),
      )
      .catch(console.error);

    fetch(`${API_BASE_URL}/statengo`)
      .then((res) => res.json())
      .then((data) =>
        setDbStateNgos(
          data
            .filter((ngo) => String(ngo.StateNGOIsActive) !== "0")
            .map((ngo) => ({
              value: ngo.StateNGORegId,
              label:
                ngo.StateNGOName ||
                ngo.StateNGOSignupUserName ||
                `State Super Administrator ${ngo.StateNGORegId}`,
              stateId: ngo.StateNGOStateId,
              stateName: ngo.StateNGOStateName,
              districtId: ngo.StateNGODistId,
              districtName: ngo.StateNGODistName,
              nationalNgoId: ngo.AcctId,
              acctHead: ngo.AcctHead || "SN",
            })),
        ),
      )
      .catch(console.error);

    fetch(`${API_BASE_URL}/districtadmin`)
      .then((res) => res.json())
      .then((data) =>
        setDbMotherNgos(
          data.map((n) => ({
            value: n.DistNGORegId,
            label: n.DistNGOName,
            districtName: n.DistNGODistName,
            stateName: n.DistNGOStateName,
            stateNgoRegId: n.StateNGORegId,
          })),
        ),
      )
      .catch(console.error);

    fetch(`${API_BASE_URL}/supervisor`)
      .then((res) => res.json())
      .then((data) =>
        setDbSupervisors(
          data.map((s) => ({
            value: s.SupRegId,
            label: s.SupName,
            userSignUpId: s.UserSignUpId || s.SupRegId,
            stateName: s.SupStateName,
            distName: s.SupDistName,
            motherNgoId: s.DistNGORegId,
            stateNgoRegId: s.StateNGORegId || s.ParentStateNGORegId,
          })),
        ),
      )
      .catch(console.error);

    fetch(`${API_BASE_URL}/asthadidi`)
      .then((res) => res.json())
      .then((data) =>
        setDbAsthaDidis(
          data.map((a) => ({
            value: a.AsthaDidiRegId,
            label: a.AsthaDidiUserName,
            stateName: a.AsthaDidiStateName,
            distName: a.AsthaDidiDistName,
            motherNgoId: a.DistNGORegId,
            supRegId: a.SupRegId,
            stateNgoRegId: a.StateNGORegId || a.ResolvedStateNGORegId,
            createdByAuthRegId: a.AsthaDidiCreatedByAuthRegId,
          })),
        ),
      )
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (refreshTrigger === 0) return;

    fetch(`${API_BASE_URL}/statengo`)
      .then((res) => res.json())
      .then((data) =>
        setDbStateNgos(
          data
            .filter((ngo) => String(ngo.StateNGOIsActive) !== "0")
            .map((ngo) => ({
              value: ngo.StateNGORegId,
              label:
                ngo.StateNGOName ||
                ngo.StateNGOSignupUserName ||
                `State Super Administrator ${ngo.StateNGORegId}`,
              stateId: ngo.StateNGOStateId,
              stateName: ngo.StateNGOStateName,
              districtId: ngo.StateNGODistId,
              districtName: ngo.StateNGODistName,
              nationalNgoId: ngo.AcctId,
              acctHead: ngo.AcctHead || "SN",
            })),
        ),
      )
      .catch(console.error);

    fetch(`${API_BASE_URL}/districtadmin`)
      .then((res) => res.json())
      .then((data) =>
        setDbMotherNgos(
          data
            .filter((n) => String(n.DistNGOIsActive) !== "0")
            .map((n) => ({
              value: n.DistNGORegId,
              label: n.DistNGOName,
              districtName: n.DistNGODistName,
              stateName: n.DistNGOStateName,
              stateNgoRegId: n.StateNGORegId,
            })),
        ),
      )
      .catch(console.error);

    fetch(`${API_BASE_URL}/supervisor`)
      .then((res) => res.json())
      .then((data) =>
        setDbSupervisors(
          data
            .filter((s) => String(s.SupIsActive) !== "0")
            .map((s) => ({
              value: s.SupRegId,
              label: s.SupName,
              userSignUpId: s.UserSignUpId || s.SupRegId,
              stateName: s.SupStateName,
              distName: s.SupDistName,
              motherNgoId: s.DistNGORegId,
              stateNgoRegId: s.StateNGORegId || s.ParentStateNGORegId,
            })),
        ),
      )
      .catch(console.error);

    fetch(`${API_BASE_URL}/asthadidi`)
      .then((res) => res.json())
      .then((data) =>
        setDbAsthaDidis(
          data
            .filter((a) => String(a.AsthaDidiIsActive) !== "0")
            .map((a) => ({
              value: a.AsthaDidiRegId,
              label: a.AsthaDidiUserName,
              stateName: a.AsthaDidiStateName,
              distName: a.AsthaDidiDistName,
              motherNgoId: a.DistNGORegId,
              supRegId: a.SupRegId,
              stateNgoRegId: a.StateNGORegId || a.ResolvedStateNGORegId,
              createdByAuthRegId: a.AsthaDidiCreatedByAuthRegId,
            })),
        ),
      )
      .catch(console.error);
  }, [refreshTrigger]);

  // =========================================================================
  // ✅ BULLETPROOF DERIVED STATE ENGINE
  // Instantly calculates exactly what dropdowns should be locked for the
  // logged-in user and forces them to be populated without waiting for effects.
  // =========================================================================
  const autoLockedFilters = useMemo(() => {
    let lockedStateNgo = null;
    let lockedMotherNgo = null;
    let lockedState = null;
    let lockedDistrict = null;
    let lockedSupervisor = null;
    let lockedAsthaDidi = null;

    if (appUserRole === "State Super Administrator" && loggedInProfileId) {
      lockedStateNgo = dbStateNgos.find(
        (sn) => String(sn.value) === String(loggedInProfileId),
      );
    } else if (appUserRole === "District Administrator" && loggedInProfileId) {
      lockedMotherNgo = dbMotherNgos.find(
        (m) => String(m.value) === String(loggedInProfileId),
      );
      if (lockedMotherNgo) {
        lockedStateNgo = dbStateNgos.find(
          (sn) => String(sn.value) === String(lockedMotherNgo.stateNgoRegId),
        );
        lockedState = dbStates.find(
          (s) =>
            s.label.toLowerCase() === lockedMotherNgo.stateName?.toLowerCase(),
        );
        lockedDistrict = dbDistricts.find(
          (d) =>
            d.label.toLowerCase() ===
            lockedMotherNgo.districtName?.toLowerCase(),
        );
      }
    } else if (appUserRole === "Supervisor" && loggedInProfileId) {
      lockedSupervisor = dbSupervisors.find(
        (s) => String(s.value) === String(loggedInProfileId),
      );
      if (lockedSupervisor) {
        lockedMotherNgo = dbMotherNgos.find(
          (m) => String(m.value) === String(lockedSupervisor.motherNgoId),
        );
        lockedStateNgo = dbStateNgos.find(
          (sn) => String(sn.value) === String(lockedSupervisor.stateNgoRegId),
        );
        lockedState = dbStates.find(
          (s) =>
            s.label.toLowerCase() === lockedSupervisor.stateName?.toLowerCase(),
        );
        lockedDistrict = dbDistricts.find(
          (d) =>
            d.label.toLowerCase() === lockedSupervisor.distName?.toLowerCase(),
        );
      }
    } else if (appUserRole === "Astha Didi" && loggedInProfileId) {
      lockedAsthaDidi = dbAsthaDidis.find(
        (a) => String(a.value) === String(loggedInProfileId),
      );
      if (lockedAsthaDidi) {
        lockedSupervisor = dbSupervisors.find(
          (s) => String(s.value) === String(lockedAsthaDidi.supRegId),
        );
        lockedMotherNgo = dbMotherNgos.find(
          (m) => String(m.value) === String(lockedAsthaDidi.motherNgoId),
        );
        lockedStateNgo = dbStateNgos.find(
          (sn) => String(sn.value) === String(lockedAsthaDidi.stateNgoRegId),
        );
        lockedState = dbStates.find(
          (s) =>
            s.label.toLowerCase() === lockedAsthaDidi.stateName?.toLowerCase(),
        );
        lockedDistrict = dbDistricts.find(
          (d) =>
            d.label.toLowerCase() === lockedAsthaDidi.distName?.toLowerCase(),
        );
      }
    }

    return {
      lockedStateNgo,
      lockedMotherNgo,
      lockedState,
      lockedDistrict,
      lockedSupervisor,
      lockedAsthaDidi,
    };
  }, [
    appUserRole,
    loggedInProfileId,
    dbStateNgos,
    dbMotherNgos,
    dbSupervisors,
    dbAsthaDidis,
    dbStates,
    dbDistricts,
  ]);

  // Unified Active States (Uses manual selection, falls back to locked selections instantly)
  const activeStateNgo = filterStateNgo || autoLockedFilters.lockedStateNgo;
  const activeMotherNgo = filterMotherNgo || autoLockedFilters.lockedMotherNgo;
  const activeState = filterState || autoLockedFilters.lockedState;
  const activeDistrict = filterDistrict || autoLockedFilters.lockedDistrict;
  const activeSupervisor =
    filterSupervisor || autoLockedFilters.lockedSupervisor;
  const activeAsthaDidi = filterAsthaDidi || autoLockedFilters.lockedAsthaDidi;

  // District Array Populator
  useEffect(() => {
    if (activeState && activeState.value) {
      fetch(`${API_BASE_URL}/districts/${activeState.value}`)
        .then((res) => res.json())
        .then((data) => {
          setDbDistricts(
            data.map((d) => ({ value: d.DistId, label: d.DistName })),
          );
        })
        .catch(console.error);
    } else {
      setDbDistricts([]);
    }
  }, [activeState?.value]);

  // =========================================================================
  // ✅ REFINED OPTION FILTERS (Uses exact derived matches)
  // =========================================================================

  const filteredStateNgos = useMemo(() => {
    if (autoLockedFilters.lockedStateNgo)
      return [autoLockedFilters.lockedStateNgo];
    if (filterNationalNgo) {
      return dbStateNgos.filter(
        (ngo) => String(ngo.nationalNgoId) === String(filterNationalNgo.value),
      );
    }
    return dbStateNgos;
  }, [dbStateNgos, filterNationalNgo, autoLockedFilters.lockedStateNgo]);

  const filteredMotherNgos = useMemo(() => {
    if (autoLockedFilters.lockedMotherNgo)
      return [autoLockedFilters.lockedMotherNgo];
    if (appUserRole === "National NGO" && !activeStateNgo) return [];
    if (activeStateNgo) {
      return dbMotherNgos.filter(
        (ngo) => String(ngo.stateNgoRegId) === String(activeStateNgo.value),
      );
    }
    return dbMotherNgos;
  }, [
    dbMotherNgos,
    appUserRole,
    activeStateNgo,
    autoLockedFilters.lockedMotherNgo,
  ]);

  const filteredStateOptions = useMemo(() => {
    if (autoLockedFilters.lockedState) return [autoLockedFilters.lockedState];
    if (activeMotherNgo && activeMotherNgo.stateName) {
      const ngoState = activeMotherNgo.stateName.trim().toLowerCase();
      return dbStates.filter((s) => s.label.trim().toLowerCase() === ngoState);
    }
    return dbStates;
  }, [dbStates, activeMotherNgo, autoLockedFilters.lockedState]);

  const filteredDistrictOptions = useMemo(() => {
    if (autoLockedFilters.lockedDistrict)
      return [autoLockedFilters.lockedDistrict];
    if (activeMotherNgo && activeMotherNgo.districtName) {
      const ngoDist = activeMotherNgo.districtName.trim().toLowerCase();
      return dbDistricts.filter(
        (d) => d.label.trim().toLowerCase() === ngoDist,
      );
    }
    return dbDistricts;
  }, [dbDistricts, activeMotherNgo, autoLockedFilters.lockedDistrict]);

  const filteredSupervisorOptions = useMemo(() => {
    if (autoLockedFilters.lockedSupervisor)
      return [autoLockedFilters.lockedSupervisor];
    if (
      (appUserRole === "National NGO" && !activeStateNgo) ||
      !activeMotherNgo ||
      !activeState ||
      !activeDistrict
    ) {
      return [];
    }

    return dbSupervisors.filter((sup) => {
      let matches = true;
      if (
        activeStateNgo &&
        String(sup.stateNgoRegId) !== String(activeStateNgo.value)
      )
        matches = false;
      if (
        activeMotherNgo &&
        String(sup.motherNgoId) !== String(activeMotherNgo.value)
      )
        matches = false;
      if (
        activeState &&
        sup.stateName?.trim().toLowerCase() !==
          activeState.label.trim().toLowerCase()
      )
        matches = false;
      if (
        activeDistrict &&
        sup.distName?.trim().toLowerCase() !==
          activeDistrict.label.trim().toLowerCase()
      )
        matches = false;
      return matches;
    });
  }, [
    dbSupervisors,
    activeStateNgo,
    activeMotherNgo,
    activeState,
    activeDistrict,
    autoLockedFilters.lockedSupervisor,
    appUserRole,
  ]);

  const filteredAsthaDidiOptions = useMemo(() => {
    if (autoLockedFilters.lockedAsthaDidi)
      return [autoLockedFilters.lockedAsthaDidi];
    if (
      appUserRole !== "Astha Didi" &&
      (!activeMotherNgo || !activeState || !activeDistrict || !activeSupervisor)
    ) {
      return [];
    }

    return dbAsthaDidis.filter((ad) => {
      let matches = true;
      if (
        activeStateNgo &&
        String(ad.stateNgoRegId) !== String(activeStateNgo.value)
      )
        matches = false;
      if (
        activeMotherNgo &&
        ad.motherNgoId != null &&
        String(ad.motherNgoId) !== String(activeMotherNgo.value)
      )
        matches = false;
      if (
        activeState &&
        ad.stateName?.trim().toLowerCase() !==
          activeState.label.trim().toLowerCase()
      )
        matches = false;
      if (
        activeDistrict &&
        ad.distName?.trim().toLowerCase() !==
          activeDistrict.label.trim().toLowerCase()
      )
        matches = false;
      if (
        activeSupervisor &&
        ad.supRegId != null &&
        String(ad.supRegId) !== String(activeSupervisor.value)
      )
        matches = false;
      return matches;
    });
  }, [
    dbAsthaDidis,
    activeStateNgo,
    activeMotherNgo,
    activeState,
    activeDistrict,
    activeSupervisor,
    autoLockedFilters.lockedAsthaDidi,
    appUserRole,
  ]);

  // =======================================================================
  // Auto-Select Helpers for Admins navigating Top-Down
  // =======================================================================
  useEffect(() => {
    if (
      !autoLockedFilters.lockedStateNgo &&
      filteredStateNgos.length === 1 &&
      !filterStateNgo
    )
      setFilterStateNgo(filteredStateNgos[0]);
  }, [filteredStateNgos, filterStateNgo, autoLockedFilters.lockedStateNgo]);

  useEffect(() => {
    if (
      !autoLockedFilters.lockedMotherNgo &&
      filteredMotherNgos.length === 1 &&
      !filterMotherNgo
    )
      setFilterMotherNgo(filteredMotherNgos[0]);
  }, [filteredMotherNgos, filterMotherNgo, autoLockedFilters.lockedMotherNgo]);

  useEffect(() => {
    if (
      !autoLockedFilters.lockedState &&
      filteredStateOptions.length === 1 &&
      !filterState
    )
      setFilterState(filteredStateOptions[0]);
  }, [filteredStateOptions, filterState, autoLockedFilters.lockedState]);

  useEffect(() => {
    if (
      !autoLockedFilters.lockedDistrict &&
      filteredDistrictOptions.length === 1 &&
      !filterDistrict
    )
      setFilterDistrict(filteredDistrictOptions[0]);
  }, [
    filteredDistrictOptions,
    filterDistrict,
    autoLockedFilters.lockedDistrict,
  ]);

  useEffect(() => {
    if (
      !autoLockedFilters.lockedSupervisor &&
      filteredSupervisorOptions.length === 1 &&
      !filterSupervisor
    )
      setFilterSupervisor(filteredSupervisorOptions[0]);
  }, [
    filteredSupervisorOptions,
    filterSupervisor,
    autoLockedFilters.lockedSupervisor,
  ]);

  useEffect(() => {
    if (
      !autoLockedFilters.lockedAsthaDidi &&
      filteredAsthaDidiOptions.length === 1 &&
      !filterAsthaDidi
    )
      setFilterAsthaDidi(filteredAsthaDidiOptions[0]);
  }, [
    filteredAsthaDidiOptions,
    filterAsthaDidi,
    autoLockedFilters.lockedAsthaDidi,
  ]);

  const handleReset = (level) => {
    if (level <= -1) setFilterStateNgo(null);
    if (level <= 0) setFilterMotherNgo(null);
    if (level <= 1) setFilterState(null);
    if (level <= 2) setFilterDistrict(null);
    if (level <= 3) setFilterSupervisor(null);
    if (level <= 4) setFilterAsthaDidi(null);
  };

  const handleFormSuccess = () => setRefreshTrigger((prev) => prev + 1);

  if (appUserRole === null)
    return <div style={{ padding: "24px" }}>Loading Interface...</div>;

  const adminOptions = [
    { value: "State Super Administrator", label: "State Super Administrator" },
    { value: "District Administrator", label: "District Administrator" },
    { value: "Supervisor", label: "Supervisor" },
    { value: "Astha Didi", label: "Astha Didi" },
    { value: "Astha Maa", label: "Astha Maa" },
  ].filter((o) => {
    if (appUserRole === "National NGO") return true;
    if (o.value === "State Super Administrator") return false;
    if (appUserRole === "District Administrator")
      return ["Supervisor", "Astha Didi", "Astha Maa"].includes(o.value);
    if (appUserRole === "Supervisor")
      return ["Astha Didi", "Astha Maa"].includes(o.value);
    if (appUserRole === "Astha Didi") return ["Astha Maa"].includes(o.value);
    return true;
  });

  const isMotherNgoVisible = [
    "Supervisor",
    "Astha Maa",
    "Astha Didi",
    "District Administrator",
  ].includes(adminActiveView);
  const isNationalNgoVisible = adminActiveView === "State Super Administrator";
  const isStateNgoVisible =
    appUserRole === "National NGO" &&
    adminActiveView !== "State Super Administrator";
  const isSupervisorVisible = ["Astha Maa", "Astha Didi"].includes(
    adminActiveView,
  );
  const isAsthaDidiVisible = ["Astha Maa"].includes(adminActiveView);

  const baseSelectStyles = styles.selectStyles(false);
  const customSelectStyles = {
    ...baseSelectStyles,
    menuPortal: (base, props) => ({
      ...(baseSelectStyles.menuPortal
        ? baseSelectStyles.menuPortal(base, props)
        : base),
      zIndex: 99999,
    }),
    menu: (base, props) => ({
      ...(baseSelectStyles.menu ? baseSelectStyles.menu(base, props) : base),
      zIndex: 99999,
      width: "max-content",
      minWidth: "100%",
    }),
    control: (base, props) => ({
      ...(baseSelectStyles.control
        ? baseSelectStyles.control(base, props)
        : base),
      minWidth: "100%",
      width: "max-content",
    }),
    option: (base, props) => ({
      ...(baseSelectStyles.option
        ? baseSelectStyles.option(base, props)
        : base),
      whiteSpace: "nowrap",
    }),
    singleValue: (base, props) => ({
      ...(baseSelectStyles.singleValue
        ? baseSelectStyles.singleValue(base, props)
        : base),
      whiteSpace: "nowrap",
      overflow: "visible",
    }),
    valueContainer: (base, props) => ({
      ...(baseSelectStyles.valueContainer
        ? baseSelectStyles.valueContainer(base, props)
        : base),
      flexWrap: "nowrap",
      whiteSpace: "nowrap",
    }),
  };

  return (
    <>
      <ToastContainer autoClose={3000} pauseOnHover={false} />
      <div
        style={{
          ...styles.card,
          padding: "24px",
          marginBottom: "24px",
          overflow: "visible",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: "1 1 auto", minWidth: "200px" }}>
          <label
            style={{ ...styles.label, marginBottom: "8px", display: "block" }}
          >
            Select Role Entry / View <span style={{ color: "#ff3e1d" }}>*</span>
          </label>
          <Select
            options={adminOptions}
            value={adminOptions.find((o) => o.value === adminActiveView)}
            onChange={(s) => {
              setAdminActiveView(s.value);
              handleReset(-1);
            }}
            styles={customSelectStyles}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            isSearchable={false}
          />
        </div>

        {isNationalNgoVisible && (
          <div style={{ flex: "1 1 auto", minWidth: "250px" }}>
            <label
              style={{ ...styles.label, marginBottom: "8px", display: "block" }}
            >
              NATIONAL NGO
            </label>
            <Select
              options={dbNationalNgos}
              value={filterNationalNgo}
              onChange={setFilterNationalNgo}
              isDisabled={appUserRole === "National NGO"}
              isClearable={appUserRole !== "National NGO"}
              placeholder="Select National NGO"
              styles={customSelectStyles}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </div>
        )}

        {isStateNgoVisible && (
          <div style={{ flex: "1 1 auto", minWidth: "250px" }}>
            <label
              style={{ ...styles.label, marginBottom: "8px", display: "block" }}
            >
              STATE SUPER ADMINISTRATOR
            </label>
            <Select
              options={filteredStateNgos}
              value={activeStateNgo}
              onChange={(s) => {
                setFilterStateNgo(s);
                handleReset(0);
              }}
              isDisabled={!!autoLockedFilters.lockedStateNgo}
              isClearable={!autoLockedFilters.lockedStateNgo}
              placeholder="Select State Super Administrator"
              styles={customSelectStyles}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </div>
        )}

        {isMotherNgoVisible && (
          <div style={{ flex: "1 1 auto", minWidth: "250px" }}>
            <label
              style={{ ...styles.label, marginBottom: "8px", display: "block" }}
            >
              DISTRICT NGO
            </label>
            <Select
              options={filteredMotherNgos}
              value={activeMotherNgo}
              onChange={(s) => {
                setFilterMotherNgo(s);
                handleReset(1);
              }}
              isDisabled={
                !!autoLockedFilters.lockedMotherNgo ||
                (appUserRole === "National NGO" && !activeStateNgo)
              }
              isClearable={!autoLockedFilters.lockedMotherNgo}
              placeholder="Select NGO"
              styles={customSelectStyles}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </div>
        )}

        {!isNationalNgoVisible && (
          <>
            <div style={{ flex: "1 1 auto", minWidth: "150px" }}>
              <label
                style={{
                  ...styles.label,
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                State
              </label>
              <Select
                options={filteredStateOptions}
                value={activeState}
                onChange={(s) => {
                  setFilterState(s);
                  handleReset(2);
                }}
                isDisabled={!activeMotherNgo || !!autoLockedFilters.lockedState}
                isClearable={!autoLockedFilters.lockedState}
                placeholder="State"
                styles={customSelectStyles}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            </div>

            <div style={{ flex: "1 1 auto", minWidth: "150px" }}>
              <label
                style={{
                  ...styles.label,
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                District
              </label>
              <Select
                options={filteredDistrictOptions}
                value={activeDistrict}
                onChange={(s) => {
                  setFilterDistrict(s);
                  handleReset(3);
                }}
                isDisabled={
                  !activeMotherNgo ||
                  !activeState ||
                  !!autoLockedFilters.lockedDistrict
                }
                isClearable={!autoLockedFilters.lockedDistrict}
                placeholder="District"
                styles={customSelectStyles}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            </div>
          </>
        )}

        {isSupervisorVisible && (
          <div style={{ flex: "1 1 auto", minWidth: "200px" }}>
            <label
              style={{ ...styles.label, marginBottom: "8px", display: "block" }}
            >
              Supervisor
            </label>
            <Select
              options={filteredSupervisorOptions}
              value={activeSupervisor}
              onChange={(s) => {
                setFilterSupervisor(s);
                handleReset(4);
              }}
              isDisabled={
                !activeDistrict || !!autoLockedFilters.lockedSupervisor
              }
              isClearable={!autoLockedFilters.lockedSupervisor}
              placeholder="Supervisor"
              styles={customSelectStyles}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </div>
        )}

        {isAsthaDidiVisible && (
          <div style={{ flex: "1 1 auto", minWidth: "200px" }}>
            <label
              style={{ ...styles.label, marginBottom: "8px", display: "block" }}
            >
              Astha Didi
            </label>
            <Select
              options={filteredAsthaDidiOptions}
              value={activeAsthaDidi}
              onChange={setFilterAsthaDidi}
              isDisabled={
                !!autoLockedFilters.lockedAsthaDidi ||
                (appUserRole === "Supervisor"
                  ? !activeDistrict
                  : !activeSupervisor)
              }
              isClearable={!autoLockedFilters.lockedAsthaDidi}
              placeholder="Astha Didi"
              styles={customSelectStyles}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </div>
        )}
      </div>

      {adminActiveView === "State Super Administrator" ? (
        <>
          <StateSuperAdminForm
            onSuccess={handleFormSuccess}
            externalFilters={{ filterNationalNgo }}
          />
          <StateSuperAdminTable
            refreshTrigger={refreshTrigger}
            externalFilters={{ filterNationalNgo }}
          />
        </>
      ) : adminActiveView === "District Administrator" ? (
        <>
          <DistrictAdminForm
            onSuccess={handleFormSuccess}
            filterStateNgo={activeStateNgo}
            defaultState={activeState}
            defaultDistrict={activeDistrict}
          />
          <DistrictAdminTable
            refreshTrigger={refreshTrigger}
            externalFilters={{
              filterStateNgo: activeStateNgo,
              filterMotherNgo: activeMotherNgo,
              filterState: activeState,
              filterDistrict: activeDistrict,
            }}
          />
        </>
      ) : adminActiveView === "Supervisor" ? (
        <>
          <SupervisorForm
            onSuccess={handleFormSuccess}
            externalFilters={{
              filterStateNgo: activeStateNgo,
              filterMotherNgo: activeMotherNgo,
              filterState: activeState,
              filterDistrict: activeDistrict,
            }}
          />
          <SupervisorTable
            refreshTrigger={refreshTrigger}
            externalFilters={{
              filterStateNgo: activeStateNgo,
              filterMotherNgo: activeMotherNgo,
              filterState: activeState,
              filterDistrict: activeDistrict,
            }}
          />
        </>
      ) : adminActiveView === "Astha Maa" ? (
        <>
          <AsthaMaaForm
            onSuccess={handleFormSuccess}
            externalFilters={{
              filterMotherNgo: activeMotherNgo,
              filterStateNgo: activeStateNgo,
              filterState: activeState,
              filterDistrict: activeDistrict,
              filterSupervisor: activeSupervisor,
              filterAsthaDidi: activeAsthaDidi,
            }}
          />
          <AsthaMaaTable
            refreshTrigger={refreshTrigger}
            externalFilters={{
              filterMotherNgo: activeMotherNgo,
              filterStateNgo: activeStateNgo,
              filterState: activeState,
              filterDistrict: activeDistrict,
              filterSupervisor: activeSupervisor,
              filterAsthaDidi: activeAsthaDidi,
            }}
          />
        </>
      ) : (
        <>
          <AsthaDidiForm
            onSuccess={handleFormSuccess}
            externalFilters={{
              filterMotherNgo: activeMotherNgo,
              filterStateNgo: activeStateNgo,
              filterState: activeState,
              filterDistrict: activeDistrict,
              filterSupervisor: activeSupervisor,
            }}
          />
          <MembersTable
            refreshTrigger={refreshTrigger}
            externalFilters={{
              filterMotherNgo: activeMotherNgo,
              filterStateNgo: activeStateNgo,
              filterState: activeState,
              filterDistrict: activeDistrict,
              filterSupervisor: activeSupervisor,
            }}
          />
        </>
      )}
    </>
  );
};

export default AccountTab;

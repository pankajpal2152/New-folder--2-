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

  const isLockedRole =
    appUserRole === "District Administrator" || appUserRole === "Supervisor";

  // ==========================================
  // INITIAL DATA FETCH
  // ==========================================
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

  // Handle distinct state fetching dynamically when state changes
  useEffect(() => {
    if (filterState && filterState.value) {
      fetch(`${API_BASE_URL}/districts/${filterState.value}`)
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
  }, [filterState]);

  // =========================================================================
  // ✅ UNIFIED ROLE AUTO-POPULATION ENGINE (BULLETPROOF FIX)
  // This explicitly grabs the logged-in profile and maps out ALL upstream
  // dropdowns safely, ignoring whether API cascades have fully loaded.
  // =========================================================================
  useEffect(() => {
    if (!appUserRole || !loggedInProfileId) return;

    const safeLower = (str) =>
      String(str || "")
        .trim()
        .toLowerCase();

    // 1. State Super Administrator Auto-populate
    if (appUserRole === "State Super Administrator") {
      if (!filterStateNgo && dbStateNgos.length > 0) {
        const mySn = dbStateNgos.find(
          (sn) => String(sn.value) === String(loggedInProfileId),
        );
        if (mySn) setFilterStateNgo(mySn);
      }
    }

    // 2. District Administrator Auto-populate
    if (appUserRole === "District Administrator") {
      const myDn = dbMotherNgos.find(
        (n) => String(n.value) === String(loggedInProfileId),
      );
      if (!myDn) return;

      if (!filterMotherNgo) setFilterMotherNgo(myDn);
      if (!filterStateNgo && dbStateNgos.length > 0) {
        setFilterStateNgo(
          dbStateNgos.find(
            (sn) => String(sn.value) === String(myDn.stateNgoRegId),
          ),
        );
      }
      if (!filterState && dbStates.length > 0) {
        setFilterState(
          dbStates.find(
            (s) => safeLower(s.label) === safeLower(myDn.stateName),
          ),
        );
      }
      if (!filterDistrict && dbDistricts.length > 0) {
        setFilterDistrict(
          dbDistricts.find(
            (d) => safeLower(d.label) === safeLower(myDn.districtName),
          ),
        );
      }
    }

    // 3. Supervisor Auto-populate
    if (appUserRole === "Supervisor") {
      const mySup = dbSupervisors.find(
        (s) => String(s.value) === String(loggedInProfileId),
      );
      if (!mySup) return;

      if (!filterSupervisor) setFilterSupervisor(mySup);
      if (!filterMotherNgo && dbMotherNgos.length > 0) {
        setFilterMotherNgo(
          dbMotherNgos.find(
            (n) => String(n.value) === String(mySup.motherNgoId),
          ),
        );
      }
      if (!filterStateNgo && dbStateNgos.length > 0) {
        setFilterStateNgo(
          dbStateNgos.find(
            (sn) => String(sn.value) === String(mySup.stateNgoRegId),
          ),
        );
      }
      if (!filterState && dbStates.length > 0) {
        setFilterState(
          dbStates.find(
            (s) => safeLower(s.label) === safeLower(mySup.stateName),
          ),
        );
      }
      if (!filterDistrict && dbDistricts.length > 0) {
        setFilterDistrict(
          dbDistricts.find(
            (d) => safeLower(d.label) === safeLower(mySup.distName),
          ),
        );
      }
    }

    // 4. Astha Didi Auto-populate
    if (appUserRole === "Astha Didi") {
      const myDidi = dbAsthaDidis.find(
        (d) => String(d.value) === String(loggedInProfileId),
      );
      if (!myDidi) return;

      if (!filterAsthaDidi) setFilterAsthaDidi(myDidi);
      if (!filterSupervisor && dbSupervisors.length > 0) {
        setFilterSupervisor(
          dbSupervisors.find(
            (s) => String(s.value) === String(myDidi.supRegId),
          ),
        );
      }
      if (!filterMotherNgo && dbMotherNgos.length > 0) {
        setFilterMotherNgo(
          dbMotherNgos.find(
            (n) => String(n.value) === String(myDidi.motherNgoId),
          ),
        );
      }
      if (!filterStateNgo && dbStateNgos.length > 0) {
        setFilterStateNgo(
          dbStateNgos.find(
            (sn) => String(sn.value) === String(myDidi.stateNgoRegId),
          ),
        );
      }
      if (!filterState && dbStates.length > 0) {
        setFilterState(
          dbStates.find(
            (s) => safeLower(s.label) === safeLower(myDidi.stateName),
          ),
        );
      }
      if (!filterDistrict && dbDistricts.length > 0) {
        setFilterDistrict(
          dbDistricts.find(
            (d) => safeLower(d.label) === safeLower(myDidi.distName),
          ),
        );
      }
    }
  }, [
    appUserRole,
    loggedInProfileId,
    dbStateNgos,
    dbMotherNgos,
    dbSupervisors,
    dbAsthaDidis,
    dbStates,
    dbDistricts,
    filterStateNgo,
    filterMotherNgo,
    filterSupervisor,
    filterState,
    filterDistrict,
    filterAsthaDidi,
  ]);

  // ==========================================
  // RELAXED DROPDOWN FILTER LOGIC
  // Prevents options from being entirely blank
  // ==========================================
  const filteredStateNgos = useMemo(() => {
    if (filterNationalNgo) {
      return dbStateNgos.filter(
        (ngo) => String(ngo.nationalNgoId) === String(filterNationalNgo.value),
      );
    }
    return dbStateNgos;
  }, [dbStateNgos, filterNationalNgo]);

  const filteredMotherNgos = useMemo(() => {
    if (appUserRole === "National NGO" && !filterStateNgo) return [];

    return dbMotherNgos.filter((ngo) => {
      let matches = true;
      if (
        filterStateNgo &&
        String(ngo.stateNgoRegId) !== String(filterStateNgo.value)
      )
        matches = false;
      if (
        appUserRole === "District Administrator" &&
        String(ngo.value) !== String(loggedInProfileId)
      )
        matches = false;
      return matches;
    });
  }, [dbMotherNgos, appUserRole, loggedInProfileId, filterStateNgo]);

  const filteredStateOptions = useMemo(() => {
    if (filterMotherNgo && filterMotherNgo.stateName) {
      const ngoState = filterMotherNgo.stateName.trim().toLowerCase();
      return dbStates.filter((s) => s.label.trim().toLowerCase() === ngoState);
    }
    return dbStates;
  }, [dbStates, filterMotherNgo]);

  const filteredDistrictOptions = useMemo(() => {
    if (filterMotherNgo && filterMotherNgo.districtName) {
      const ngoDist = filterMotherNgo.districtName.trim().toLowerCase();
      return dbDistricts.filter(
        (d) => d.label.trim().toLowerCase() === ngoDist,
      );
    }
    return dbDistricts;
  }, [dbDistricts, filterMotherNgo]);

  const filteredSupervisorOptions = useMemo(() => {
    return dbSupervisors.filter((sup) => {
      let matches = true;
      if (
        filterStateNgo &&
        String(sup.stateNgoRegId) !== String(filterStateNgo.value)
      )
        matches = false;
      if (
        filterMotherNgo &&
        String(sup.motherNgoId) !== String(filterMotherNgo.value)
      )
        matches = false;
      if (
        filterState &&
        sup.stateName?.trim().toLowerCase() !==
          filterState.label.trim().toLowerCase()
      )
        matches = false;
      if (
        filterDistrict &&
        sup.distName?.trim().toLowerCase() !==
          filterDistrict.label.trim().toLowerCase()
      )
        matches = false;

      // Auto-lock for Supervisor logging in
      if (
        appUserRole === "Supervisor" &&
        String(sup.value) !== String(loggedInProfileId)
      )
        matches = false;

      return matches;
    });
  }, [
    dbSupervisors,
    filterStateNgo,
    filterMotherNgo,
    filterState,
    filterDistrict,
    appUserRole,
    loggedInProfileId,
  ]);

  const filteredAsthaDidiOptions = useMemo(() => {
    const user = getSafeUser();
    const currentUserId = user ? user.id || user.UserSignUpId : null;

    return dbAsthaDidis.filter((ad) => {
      let matches = true;
      if (
        filterStateNgo &&
        String(ad.stateNgoRegId) !== String(filterStateNgo.value)
      )
        matches = false;
      if (
        filterMotherNgo &&
        ad.motherNgoId != null &&
        String(ad.motherNgoId) !== String(filterMotherNgo.value)
      )
        matches = false;
      if (
        filterState &&
        ad.stateName?.trim().toLowerCase() !==
          filterState.label.trim().toLowerCase()
      )
        matches = false;
      if (
        filterDistrict &&
        ad.distName?.trim().toLowerCase() !==
          filterDistrict.label.trim().toLowerCase()
      )
        matches = false;
      if (
        filterSupervisor &&
        ad.supRegId != null &&
        String(ad.supRegId) !== String(filterSupervisor.value)
      )
        matches = false;

      if (
        appUserRole === "Astha Didi" &&
        String(ad.value) !== String(loggedInProfileId)
      )
        matches = false;

      if (appUserRole === "Supervisor" && loggedInProfileId) {
        const matchBySupRegId =
          ad.supRegId != null &&
          String(ad.supRegId) === String(loggedInProfileId);
        const matchByCreator =
          ad.createdByAuthRegId != null &&
          String(ad.createdByAuthRegId) === String(currentUserId);
        if (!matchBySupRegId && !matchByCreator) matches = false;
      }
      return matches;
    });
  }, [
    dbAsthaDidis,
    filterMotherNgo,
    filterState,
    filterDistrict,
    filterSupervisor,
    filterStateNgo,
    appUserRole,
    loggedInProfileId,
  ]);

  // Handle downstream clear cascades
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
              value={filterStateNgo}
              onChange={(s) => {
                setFilterStateNgo(s);
                handleReset(0);
              }}
              isClearable
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
              value={filterMotherNgo}
              onChange={(s) => {
                setFilterMotherNgo(s);
                handleReset(1);
              }}
              isDisabled={
                isLockedRole ||
                appUserRole === "Astha Didi" ||
                (appUserRole === "National NGO" && !filterStateNgo)
              }
              isClearable={!isLockedRole && appUserRole !== "Astha Didi"}
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
                value={filterState}
                onChange={(s) => {
                  setFilterState(s);
                  handleReset(2);
                }}
                isDisabled={
                  !filterMotherNgo ||
                  isLockedRole ||
                  appUserRole === "Astha Didi"
                }
                isClearable={!isLockedRole && appUserRole !== "Astha Didi"}
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
                value={filterDistrict}
                onChange={(s) => {
                  setFilterDistrict(s);
                  handleReset(3);
                }}
                isDisabled={
                  !filterMotherNgo ||
                  !filterState ||
                  isLockedRole ||
                  appUserRole === "Astha Didi"
                }
                isClearable={!isLockedRole && appUserRole !== "Astha Didi"}
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
              value={filterSupervisor}
              onChange={(s) => {
                setFilterSupervisor(s);
                handleReset(4);
              }}
              isDisabled={
                appUserRole === "Supervisor" || appUserRole === "Astha Didi"
              }
              isClearable={
                appUserRole !== "Astha Didi" && appUserRole !== "Supervisor"
              }
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
              value={filterAsthaDidi}
              onChange={setFilterAsthaDidi}
              isDisabled={
                appUserRole === "Astha Didi"
                  ? true
                  : appUserRole === "Supervisor"
                    ? !filterDistrict
                    : !filterSupervisor
              }
              isClearable={appUserRole !== "Astha Didi"}
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
            filterStateNgo={filterStateNgo}
            defaultState={filterState}
            defaultDistrict={filterDistrict}
          />
          <DistrictAdminTable
            refreshTrigger={refreshTrigger}
            externalFilters={{
              filterStateNgo,
              filterMotherNgo,
              filterState,
              filterDistrict,
            }}
          />
        </>
      ) : adminActiveView === "Supervisor" ? (
        <>
          <SupervisorForm
            onSuccess={handleFormSuccess}
            externalFilters={{
              filterStateNgo,
              filterMotherNgo,
              filterState,
              filterDistrict,
            }}
          />
          <SupervisorTable
            refreshTrigger={refreshTrigger}
            externalFilters={{
              filterStateNgo,
              filterMotherNgo,
              filterState,
              filterDistrict,
            }}
          />
        </>
      ) : adminActiveView === "Astha Maa" ? (
        <>
          <AsthaMaaForm
            onSuccess={handleFormSuccess}
            externalFilters={{
              filterMotherNgo,
              filterStateNgo,
              filterState,
              filterDistrict,
              filterSupervisor,
              filterAsthaDidi,
            }}
          />
          <AsthaMaaTable
            refreshTrigger={refreshTrigger}
            externalFilters={{
              filterMotherNgo,
              filterStateNgo,
              filterState,
              filterDistrict,
              filterSupervisor,
              filterAsthaDidi,
            }}
          />
        </>
      ) : (
        <>
          <AsthaDidiForm
            onSuccess={handleFormSuccess}
            externalFilters={{
              filterMotherNgo,
              filterStateNgo,
              filterState,
              filterDistrict,
              filterSupervisor,
            }}
          />
          <MembersTable
            refreshTrigger={refreshTrigger}
            externalFilters={{
              filterMotherNgo,
              filterStateNgo,
              filterState,
              filterDistrict,
              filterSupervisor,
            }}
          />
        </>
      )}
    </>
  );
};

export default AccountTab;

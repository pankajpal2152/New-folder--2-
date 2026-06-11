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

  useEffect(() => {
    const user = getSafeUser();
    let currentRole = "";
    let currentNationalNgoOption = null;
    let currentStateNgoId = null;

    if (user) {
      const role = user.role || user.UserSignUpRole || "";
      currentRole = role;
      setAppUserRole(role);
      setLoggedInProfileId(user.ProfileRegId);
      currentStateNgoId =
        role === "State Super Administrator"
          ? user.ProfileRegId || user.id || user.UserSignUpId
          : null;

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

    fetch(`${API_BASE_URL}/statengo`)
      .then((res) => res.json())
      .then((data) => {
        const options = data
          .filter((ngo) => String(ngo.StateNGOIsActive) !== "0")
          .map((ngo) => ({
            value: ngo.StateNGORegId,
            label: ngo.StateNGOName,
            stateId: ngo.StateNGOStateId,
            stateName: ngo.StateNGOStateName,
            districtId: ngo.StateNGODistId,
            districtName: ngo.StateNGODistName,
            nationalNgoId: ngo.AcctId,
          }));

        setDbStateNgos(options);

        if (currentRole === "State Super Administrator" && currentStateNgoId) {
          const ownStateNgo = options.find(
            (option) => String(option.value) === String(currentStateNgoId),
          );
          if (ownStateNgo) setFilterStateNgo(ownStateNgo);
        }
      })
      .catch(console.error);

    fetch(`${API_BASE_URL}/states`)
      .then((res) => res.json())
      .then((data) =>
        setDbStates(
          data.map((s) => ({ value: s.StateId, label: s.StateName })),
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
            stateNgoRegId: a.ResolvedStateNGORegId || a.StateNGORegId,
            createdByAuthRegId: a.AsthaDidiCreatedByAuthRegId,
          })),
        ),
      )
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (
      appUserRole === "Astha Didi" &&
      dbAsthaDidis.length > 0 &&
      dbMotherNgos.length > 0 &&
      loggedInProfileId
    ) {
      const myDidi = dbAsthaDidis.find(
        (d) => String(d.value) === String(loggedInProfileId),
      );

      if (myDidi) {
        const matchedNgo = dbMotherNgos.find(
          (n) => String(n.value) === String(myDidi.motherNgoId),
        );
        if (matchedNgo) setFilterMotherNgo(matchedNgo);

        const matchedState = dbStates.find(
          (s) => s.label.toLowerCase() === myDidi.stateName?.toLowerCase(),
        );
        if (matchedState) setFilterState(matchedState);

        const matchedDist = dbDistricts.find(
          (d) => d.label.toLowerCase() === myDidi.distName?.toLowerCase(),
        );
        if (matchedDist) setFilterDistrict(matchedDist);

        const matchedSup = dbSupervisors.find(
          (s) => String(s.value) === String(myDidi.supRegId),
        );
        if (matchedSup) setFilterSupervisor(matchedSup);
      }
    }
  }, [
    appUserRole,
    dbAsthaDidis,
    dbMotherNgos,
    dbStates,
    dbDistricts,
    dbSupervisors,
    loggedInProfileId,
  ]);

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

  const filteredStateNgos = useMemo(() => {
    return dbStateNgos.filter((stateNgo) => {
      if (
        appUserRole === "State Super Administrator" &&
        loggedInProfileId &&
        String(stateNgo.value) !== String(loggedInProfileId)
      ) {
        return false;
      }

      if (
        filterNationalNgo &&
        stateNgo.nationalNgoId != null &&
        String(stateNgo.nationalNgoId) !== String(filterNationalNgo.value)
      ) {
        return false;
      }

      return true;
    });
  }, [dbStateNgos, appUserRole, loggedInProfileId, filterNationalNgo]);

  const filteredMotherNgos = useMemo(() => {
    if (appUserRole === "National NGO" && !filterStateNgo) return [];
    if (appUserRole === "District Administrator" && loggedInProfileId)
      return dbMotherNgos.filter(
        (ngo) => String(ngo.value) === String(loggedInProfileId),
      );
    if (
      appUserRole === "Supervisor" &&
      loggedInProfileId &&
      dbSupervisors.length > 0
    ) {
      const currentSupervisor = dbSupervisors.find(
        (sup) => String(sup.value) === String(loggedInProfileId),
      );
      if (currentSupervisor && currentSupervisor.motherNgoId)
        return dbMotherNgos.filter(
          (ngo) => String(ngo.value) === String(currentSupervisor.motherNgoId),
        );
    }
    if (filterStateNgo) {
      return dbMotherNgos.filter(
        (ngo) => String(ngo.stateNgoRegId) === String(filterStateNgo.value),
      );
    }
    if (appUserRole === "State Super Administrator" && loggedInProfileId) {
      return dbMotherNgos.filter(
        (ngo) => String(ngo.stateNgoRegId) === String(loggedInProfileId),
      );
    }
    return dbMotherNgos;
  }, [
    dbMotherNgos,
    appUserRole,
    loggedInProfileId,
    dbSupervisors,
    filterStateNgo,
  ]);

  const filteredStateOptions = useMemo(() => {
    if (filterMotherNgo && filterMotherNgo.stateName) {
      const ngoState = filterMotherNgo.stateName.trim().toLowerCase();
      return dbStates.filter((s) => s.label.trim().toLowerCase() === ngoState);
    }
    if (filterStateNgo && (filterStateNgo.stateId || filterStateNgo.stateName)) {
      return dbStates.filter(
        (s) =>
          String(s.value) === String(filterStateNgo.stateId) ||
          s.label.trim().toLowerCase() ===
            String(filterStateNgo.stateName || "").trim().toLowerCase(),
      );
    }
    return dbStates;
  }, [dbStates, filterMotherNgo, filterStateNgo]);

  const filteredDistrictOptions = useMemo(() => {
    if (filterMotherNgo && filterMotherNgo.districtName) {
      const ngoDist = filterMotherNgo.districtName.trim().toLowerCase();
      return dbDistricts.filter(
        (d) => d.label.trim().toLowerCase() === ngoDist,
      );
    }
    if (
      filterStateNgo &&
      (filterStateNgo.districtId || filterStateNgo.districtName)
    ) {
      return dbDistricts.filter(
        (d) =>
          String(d.value) === String(filterStateNgo.districtId) ||
          d.label.trim().toLowerCase() ===
            String(filterStateNgo.districtName || "").trim().toLowerCase(),
      );
    }
    return dbDistricts;
  }, [dbDistricts, filterMotherNgo, filterStateNgo]);

  const filteredSupervisorOptions = useMemo(() => {
    return dbSupervisors.filter((sup) => {
      let matches = true;
      if (
        filterStateNgo &&
        sup.stateNgoRegId != null &&
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
      return matches;
    });
  }, [
    dbSupervisors,
    filterStateNgo,
    filterMotherNgo,
    filterState,
    filterDistrict,
  ]);

  const filteredAsthaDidiOptions = useMemo(() => {
    const user = getSafeUser();
    const currentUserId = user ? user.id || user.UserSignUpId : null;
    const currentProfileId = user ? user.ProfileRegId : null;

    return dbAsthaDidis.filter((ad) => {
      let matches = true;
      if (
        filterStateNgo &&
        ad.stateNgoRegId != null &&
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

      if (appUserRole === "Astha Didi") {
        if (String(ad.value) !== String(currentProfileId)) matches = false;
      } else if (appUserRole === "Supervisor") {
        const matchBySupRegId =
          ad.supRegId != null &&
          String(ad.supRegId) === String(currentProfileId);
        const matchByCreator =
          ad.createdByAuthRegId != null &&
          String(ad.createdByAuthRegId) === String(currentUserId);
        if (!matchBySupRegId && !matchByCreator) matches = false;
      } else if (filterSupervisor) {
        const matchBySupRegId =
          ad.supRegId != null &&
          String(ad.supRegId) === String(filterSupervisor.value);
        const matchByCreator =
          ad.createdByAuthRegId != null &&
          filterSupervisor.userSignUpId != null &&
          String(ad.createdByAuthRegId) ===
            String(filterSupervisor.userSignUpId);
        if (!matchBySupRegId && !matchByCreator) matches = false;
      }
      return matches;
    });
  }, [
    dbAsthaDidis,
    filterStateNgo,
    filterMotherNgo,
    filterState,
    filterDistrict,
    filterSupervisor,
    appUserRole,
  ]);

  useEffect(() => {
    if (filteredMotherNgos.length === 1 && !filterMotherNgo)
      setFilterMotherNgo(filteredMotherNgos[0]);
  }, [filteredMotherNgos, filterMotherNgo]);

  useEffect(() => {
    if (
      ["National NGO", "State Super Administrator"].includes(appUserRole) &&
      filteredStateNgos.length === 1 &&
      !filterStateNgo
    ) {
      setFilterStateNgo(filteredStateNgos[0]);
    }
  }, [appUserRole, filteredStateNgos, filterStateNgo]);

  useEffect(() => {
    if (filteredStateOptions.length === 1 && !filterState)
      setFilterState(filteredStateOptions[0]);
  }, [filteredStateOptions, filterState]);

  useEffect(() => {
    if (filteredDistrictOptions.length === 1 && !filterDistrict)
      setFilterDistrict(filteredDistrictOptions[0]);
  }, [filteredDistrictOptions, filterDistrict]);

  useEffect(() => {
    if (
      appUserRole === "Supervisor" &&
      filteredSupervisorOptions.length === 1 &&
      !filterSupervisor
    )
      setFilterSupervisor(filteredSupervisorOptions[0]);
  }, [appUserRole, filteredSupervisorOptions, filterSupervisor]);

  useEffect(() => {
    if (filteredAsthaDidiOptions.length === 1 && !filterAsthaDidi)
      setFilterAsthaDidi(filteredAsthaDidiOptions[0]);
  }, [filteredAsthaDidiOptions, filterAsthaDidi]);

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
    if (o.value === "State Super Administrator" && appUserRole !== "National NGO")
      return false;
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

  // ✅ FIXED: Advanced layout rules for seamless, unbroken text in react-select
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
      width: "max-content", // Allow dropdown options to expand as far as they need
      minWidth: "100%",
    }),
    control: (base, props) => ({
      ...(baseSelectStyles.control
        ? baseSelectStyles.control(base, props)
        : base),
      minWidth: "100%",
      width: "max-content", // Allow input box to stretch to fully display selected text
    }),
    option: (base, props) => ({
      ...(baseSelectStyles.option
        ? baseSelectStyles.option(base, props)
        : base),
      whiteSpace: "nowrap", // Strictly prevent text breaking across lines in the dropdown
    }),
    singleValue: (base, props) => ({
      ...(baseSelectStyles.singleValue
        ? baseSelectStyles.singleValue(base, props)
        : base),
      whiteSpace: "nowrap", // Prevent selected value breaking in the input box
      overflow: "visible", // Ensure visibility
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
        {/* ✅ FIXED: Removed maxWidth to let inputs naturally grow */}
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
              const shouldResetStateNgo =
                appUserRole === "National NGO" &&
                (adminActiveView === "State Super Administrator" ||
                  s.value === "State Super Administrator");
              setAdminActiveView(s.value);
              handleReset(shouldResetStateNgo ? -1 : 0);
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
              onChange={(s) => {
                setFilterNationalNgo(s);
                handleReset(-1);
              }}
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
                (appUserRole === "National NGO" && !filterStateNgo) ||
                isLockedRole ||
                appUserRole === "Astha Didi"
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
                  !(filterMotherNgo || filterStateNgo) ||
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
                  !filterState || isLockedRole || appUserRole === "Astha Didi"
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
                !filterDistrict ||
                (appUserRole === "National NGO" && !filterMotherNgo) ||
                appUserRole === "Astha Didi"
              }
              isClearable={appUserRole !== "Astha Didi"}
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
            defaultState={filterState}
            defaultDistrict={filterDistrict}
            filterStateNgo={filterStateNgo}
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
              filterStateNgo,
              filterMotherNgo,
              filterState,
              filterDistrict,
              filterSupervisor,
              filterAsthaDidi,
            }}
          />
          <AsthaMaaTable
            refreshTrigger={refreshTrigger}
            externalFilters={{
              filterStateNgo,
              filterMotherNgo,
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
              filterStateNgo,
              filterMotherNgo,
              filterState,
              filterDistrict,
              filterSupervisor,
            }}
          />
          <MembersTable
            refreshTrigger={refreshTrigger}
            externalFilters={{
              filterStateNgo,
              filterMotherNgo,
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

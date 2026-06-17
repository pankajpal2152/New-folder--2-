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

  const isLockedRole = [
    "District Administrator",
    "Supervisor",
    "Astha Didi",
    "Astha Maa",
  ].includes(appUserRole);

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
  // ✅ CASCADING AUTO-POPULATE LOGIC
  // Instantly populates State, District, and State NGO when District NGO is selected
  // Handles hierarchy upwards automatically based on selection
  // =========================================================================

  // 1. Astha Didi -> Supervisor
  useEffect(() => {
    if (!filterAsthaDidi) return;
    const matchedSup = dbSupervisors.find(
      (s) => String(s.value) === String(filterAsthaDidi.supRegId),
    );
    if (
      matchedSup &&
      String(filterSupervisor?.value) !== String(matchedSup.value)
    ) {
      setFilterSupervisor(matchedSup);
    }
  }, [filterAsthaDidi, dbSupervisors, filterSupervisor]);

  // 2. Supervisor -> District NGO (Mother NGO)
  useEffect(() => {
    if (!filterSupervisor) return;
    const matchedMother = dbMotherNgos.find(
      (m) => String(m.value) === String(filterSupervisor.motherNgoId),
    );
    if (
      matchedMother &&
      String(filterMotherNgo?.value) !== String(matchedMother.value)
    ) {
      setFilterMotherNgo(matchedMother);
    }
  }, [filterSupervisor, dbMotherNgos, filterMotherNgo]);

  // 3. District NGO -> State NGO & State
  useEffect(() => {
    if (!filterMotherNgo) return;

    // Auto-select State NGO
    if (dbStateNgos.length > 0) {
      const matchedStateNgo = dbStateNgos.find(
        (sn) => String(sn.value) === String(filterMotherNgo.stateNgoRegId),
      );
      if (
        matchedStateNgo &&
        String(filterStateNgo?.value) !== String(matchedStateNgo.value)
      ) {
        setFilterStateNgo(matchedStateNgo);
      }
    }

    // Auto-select State
    if (dbStates.length > 0 && filterMotherNgo.stateName) {
      const matchedState = dbStates.find(
        (s) =>
          s.label.trim().toLowerCase() ===
          String(filterMotherNgo.stateName).trim().toLowerCase(),
      );
      if (
        matchedState &&
        String(filterState?.value) !== String(matchedState.value)
      ) {
        setFilterState(matchedState);
      }
    }
  }, [filterMotherNgo, dbStateNgos, dbStates, filterStateNgo, filterState]);

  // 4. District NGO -> District (waits for dbDistricts to load from State selection)
  useEffect(() => {
    if (!filterMotherNgo || dbDistricts.length === 0) return;

    if (filterMotherNgo.districtName) {
      const matchedDist = dbDistricts.find(
        (d) =>
          d.label.trim().toLowerCase() ===
          String(filterMotherNgo.districtName).trim().toLowerCase(),
      );
      if (
        matchedDist &&
        String(filterDistrict?.value) !== String(matchedDist.value)
      ) {
        setFilterDistrict(matchedDist);
      }
    }
  }, [filterMotherNgo, dbDistricts, filterDistrict]);

  const filteredStateNgos = useMemo(() => {
    if (appUserRole === "State Super Administrator" && loggedInProfileId) {
      return dbStateNgos.filter(
        (ngo) => String(ngo.value) === String(loggedInProfileId),
      );
    }
    return dbStateNgos;
  }, [dbStateNgos, appUserRole, loggedInProfileId]);

  useEffect(() => {
    if (
      appUserRole === "State Super Administrator" &&
      filteredStateNgos.length === 1 &&
      !filterStateNgo
    ) {
      setFilterStateNgo(filteredStateNgos[0]);
    }
  }, [appUserRole, filteredStateNgos, filterStateNgo]);

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
    if (
      (appUserRole === "National NGO" && !filterStateNgo) ||
      !filterMotherNgo ||
      !filterState ||
      !filterDistrict
    ) {
      return [];
    }

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
      return matches;
    });
  }, [
    dbSupervisors,
    filterStateNgo,
    filterMotherNgo,
    filterState,
    filterDistrict,
    appUserRole,
  ]);

  const filteredAsthaDidiOptions = useMemo(() => {
    if (
      appUserRole !== "Astha Didi" &&
      (!filterMotherNgo || !filterState || !filterDistrict || !filterSupervisor)
    ) {
      return [];
    }

    const user = getSafeUser();
    const currentUserId = user ? user.id || user.UserSignUpId : null;
    const currentProfileId = user ? user.ProfileRegId : null;

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
    filterMotherNgo,
    filterState,
    filterDistrict,
    filterSupervisor,
    filterStateNgo,
    appUserRole,
  ]);

  useEffect(() => {
    if (isLockedRole && filteredMotherNgos.length === 1 && !filterMotherNgo)
      setFilterMotherNgo(filteredMotherNgos[0]);
  }, [filteredMotherNgos, filterMotherNgo, isLockedRole]);

  useEffect(() => {
    if (filterMotherNgo && filteredStateOptions.length === 1 && !filterState)
      setFilterState(filteredStateOptions[0]);
  }, [filteredStateOptions, filterState, filterMotherNgo]);

  useEffect(() => {
    if (filterState && filteredDistrictOptions.length === 1 && !filterDistrict)
      setFilterDistrict(filteredDistrictOptions[0]);
  }, [filteredDistrictOptions, filterDistrict, filterState]);

  useEffect(() => {
    if (
      appUserRole === "Supervisor" &&
      filteredSupervisorOptions.length === 1 &&
      !filterSupervisor
    )
      setFilterSupervisor(filteredSupervisorOptions[0]);
  }, [appUserRole, filteredSupervisorOptions, filterSupervisor]);

  useEffect(() => {
    if (
      (appUserRole === "Astha Didi" || filterSupervisor) &&
      filteredAsthaDidiOptions.length === 1 &&
      !filterAsthaDidi
    )
      setFilterAsthaDidi(filteredAsthaDidiOptions[0]);
  }, [
    filteredAsthaDidiOptions,
    filterAsthaDidi,
    filterSupervisor,
    appUserRole,
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
              value={filterStateNgo}
              onChange={(s) => {
                setFilterStateNgo(s);
                handleReset(0);
              }}
              isDisabled={isLockedRole}
              isClearable={!isLockedRole}
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
                (appUserRole === "National NGO" && !filterStateNgo)
              }
              isClearable={!isLockedRole}
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
                isDisabled={!filterMotherNgo || isLockedRole}
                isClearable={!isLockedRole}
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
                isDisabled={!filterMotherNgo || !filterState || isLockedRole}
                isClearable={!isLockedRole}
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
                appUserRole === "Supervisor" ||
                appUserRole === "Astha Didi" ||
                appUserRole === "Astha Maa"
              }
              isClearable={
                appUserRole !== "Supervisor" &&
                appUserRole !== "Astha Didi" &&
                appUserRole !== "Astha Maa"
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
                appUserRole === "Astha Didi" || appUserRole === "Astha Maa"
                  ? true
                  : appUserRole === "Supervisor"
                    ? !filterDistrict
                    : !filterSupervisor
              }
              isClearable={
                appUserRole !== "Astha Didi" && appUserRole !== "Astha Maa"
              }
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

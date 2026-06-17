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
  // ✅ AUTO-LOCK USER PROFILE
  // Locks the exact dropdown row corresponding to the logged-in user
  // =========================================================================
  useEffect(() => {
    if (!loggedInProfileId || !appUserRole) return;
    const pid = String(loggedInProfileId);

    if (appUserRole === "State Super Administrator" && dbStateNgos.length) {
      const match = dbStateNgos.find((x) => String(x.value) === pid);
      if (match && filterStateNgo?.value !== match.value)
        setFilterStateNgo(match);
    } else if (
      appUserRole === "District Administrator" &&
      dbMotherNgos.length
    ) {
      const match = dbMotherNgos.find((x) => String(x.value) === pid);
      if (match && filterMotherNgo?.value !== match.value)
        setFilterMotherNgo(match);
    } else if (appUserRole === "Supervisor" && dbSupervisors.length) {
      const match = dbSupervisors.find((x) => String(x.value) === pid);
      if (match && filterSupervisor?.value !== match.value)
        setFilterSupervisor(match);
    } else if (appUserRole === "Astha Didi" && dbAsthaDidis.length) {
      const match = dbAsthaDidis.find((x) => String(x.value) === pid);
      if (match && filterAsthaDidi?.value !== match.value)
        setFilterAsthaDidi(match);
    }
  }, [
    appUserRole,
    loggedInProfileId,
    dbStateNgos,
    dbMotherNgos,
    dbSupervisors,
    dbAsthaDidis,
    filterStateNgo,
    filterMotherNgo,
    filterSupervisor,
    filterAsthaDidi,
  ]);

  // =========================================================================
  // ✅ UPWARD SYNC ENGINE
  // Automatically populates State, District, and Upper NGOs based on child selection
  // =========================================================================

  // Astha Didi -> Auto select Supervisor
  useEffect(() => {
    if (filterAsthaDidi && dbSupervisors.length) {
      const parent = dbSupervisors.find(
        (x) => String(x.value) === String(filterAsthaDidi.supRegId),
      );
      if (parent && filterSupervisor?.value !== parent.value)
        setFilterSupervisor(parent);
    }
  }, [filterAsthaDidi, dbSupervisors, filterSupervisor]);

  // Supervisor -> Auto select Mother NGO
  useEffect(() => {
    if (filterSupervisor && dbMotherNgos.length) {
      const parent = dbMotherNgos.find(
        (x) => String(x.value) === String(filterSupervisor.motherNgoId),
      );
      if (parent && filterMotherNgo?.value !== parent.value)
        setFilterMotherNgo(parent);
    }
  }, [filterSupervisor, dbMotherNgos, filterMotherNgo]);

  // Mother NGO -> Auto select State NGO, State, and District
  useEffect(() => {
    if (filterMotherNgo) {
      if (dbStateNgos.length) {
        const parent = dbStateNgos.find(
          (x) => String(x.value) === String(filterMotherNgo.stateNgoRegId),
        );
        if (parent && filterStateNgo?.value !== parent.value)
          setFilterStateNgo(parent);
      }
      if (dbStates.length && filterMotherNgo.stateName) {
        const st = dbStates.find(
          (x) =>
            x.label.trim().toLowerCase() ===
            filterMotherNgo.stateName.trim().toLowerCase(),
        );
        if (st && filterState?.value !== st.value) setFilterState(st);
      }
      if (dbDistricts.length && filterMotherNgo.districtName) {
        const dt = dbDistricts.find(
          (x) =>
            x.label.trim().toLowerCase() ===
            filterMotherNgo.districtName.trim().toLowerCase(),
        );
        if (dt && filterDistrict?.value !== dt.value) setFilterDistrict(dt);
      }
    }
  }, [
    filterMotherNgo,
    dbStateNgos,
    dbStates,
    dbDistricts,
    filterStateNgo,
    filterState,
    filterDistrict,
  ]);

  // =========================================================================
  // ✅ STRICT DOWNWARD CASCADING FILTER OPTIONS
  // =========================================================================

  const filteredStateNgos = useMemo(() => {
    if (appUserRole === "State Super Administrator" && filterStateNgo)
      return [filterStateNgo];
    // NOTE: Intentionally allowing ALL State NGOs to show for National NGO.
    return dbStateNgos;
  }, [dbStateNgos, appUserRole, filterStateNgo]);

  const filteredMotherNgos = useMemo(() => {
    if (appUserRole === "District Administrator" && filterMotherNgo)
      return [filterMotherNgo];
    if (filterStateNgo) {
      return dbMotherNgos.filter(
        (ngo) => String(ngo.stateNgoRegId) === String(filterStateNgo.value),
      );
    }
    if (
      appUserRole === "National NGO" ||
      appUserRole === "State Super Administrator"
    )
      return [];
    return dbMotherNgos;
  }, [dbMotherNgos, appUserRole, filterStateNgo, filterMotherNgo]);

  const filteredStateOptions = useMemo(() => {
    if (filterMotherNgo && filterMotherNgo.stateName) {
      return dbStates.filter(
        (s) =>
          s.label.trim().toLowerCase() ===
          filterMotherNgo.stateName.trim().toLowerCase(),
      );
    }
    return dbStates;
  }, [dbStates, filterMotherNgo]);

  const filteredDistrictOptions = useMemo(() => {
    if (filterMotherNgo && filterMotherNgo.districtName) {
      return dbDistricts.filter(
        (d) =>
          d.label.trim().toLowerCase() ===
          filterMotherNgo.districtName.trim().toLowerCase(),
      );
    }
    return dbDistricts;
  }, [dbDistricts, filterMotherNgo]);

  const filteredSupervisorOptions = useMemo(() => {
    if (appUserRole === "Supervisor" && filterSupervisor)
      return [filterSupervisor];
    if (filterDistrict && filterMotherNgo) {
      return dbSupervisors.filter(
        (sup) =>
          String(sup.motherNgoId) === String(filterMotherNgo.value) &&
          sup.distName?.trim().toLowerCase() ===
            filterDistrict.label.trim().toLowerCase(),
      );
    }
    return [];
  }, [
    dbSupervisors,
    filterDistrict,
    filterMotherNgo,
    appUserRole,
    filterSupervisor,
  ]);

  const filteredAsthaDidiOptions = useMemo(() => {
    if (appUserRole === "Astha Didi" && filterAsthaDidi)
      return [filterAsthaDidi];
    if (filterSupervisor) {
      return dbAsthaDidis.filter(
        (ad) => String(ad.supRegId) === String(filterSupervisor.value),
      );
    }
    return [];
  }, [dbAsthaDidis, filterSupervisor, appUserRole, filterAsthaDidi]);

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
              isDisabled={[
                "State Super Administrator",
                "District Administrator",
                "Supervisor",
                "Astha Didi",
                "Astha Maa",
              ].includes(appUserRole)}
              isClearable={
                ![
                  "State Super Administrator",
                  "District Administrator",
                  "Supervisor",
                  "Astha Didi",
                  "Astha Maa",
                ].includes(appUserRole)
              }
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
                !filterStateNgo ||
                [
                  "District Administrator",
                  "Supervisor",
                  "Astha Didi",
                  "Astha Maa",
                ].includes(appUserRole)
              }
              isClearable={
                ![
                  "District Administrator",
                  "Supervisor",
                  "Astha Didi",
                  "Astha Maa",
                ].includes(appUserRole)
              }
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
                  [
                    "District Administrator",
                    "Supervisor",
                    "Astha Didi",
                    "Astha Maa",
                  ].includes(appUserRole)
                }
                isClearable={
                  ![
                    "District Administrator",
                    "Supervisor",
                    "Astha Didi",
                    "Astha Maa",
                  ].includes(appUserRole)
                }
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
                  [
                    "District Administrator",
                    "Supervisor",
                    "Astha Didi",
                    "Astha Maa",
                  ].includes(appUserRole)
                }
                isClearable={
                  ![
                    "District Administrator",
                    "Supervisor",
                    "Astha Didi",
                    "Astha Maa",
                  ].includes(appUserRole)
                }
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
                ["Supervisor", "Astha Didi", "Astha Maa"].includes(appUserRole)
              }
              isClearable={
                !["Supervisor", "Astha Didi", "Astha Maa"].includes(appUserRole)
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
                !filterSupervisor ||
                ["Astha Didi", "Astha Maa"].includes(appUserRole)
              }
              isClearable={!["Astha Didi", "Astha Maa"].includes(appUserRole)}
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

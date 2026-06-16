import React, { useState, useEffect, useRef, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import {
  API_BASE_URL,
  DUMMY_AVATAR,
  extractBase64,
  styles,
  FormInput,
} from "../config/constants";
import { accountSchema } from "./forms/AsthaDidiForm";
import {
  getSafeUser,
  PasswordInput,
  validateUniqueFields,
} from "./AccountSharedUtils";
import Select from "react-select";

const formatDisplayDate = (dbDateStr) => {
  if (!dbDateStr) return "-";
  return String(dbDateStr).substring(0, 10);
};

const AsthaDidiModal = ({ member, mode, onClose, onSuccess }) => {
  const isView = mode === "view";
  const isReadOnlyField = isView || mode === "edit";

  const cleanInitialImage =
    extractBase64(member.AsthaDidiProfileImage) || DUMMY_AVATAR;
  const [profileImage, setProfileImage] = useState(cleanInitialImage);
  const fileInputRef = useRef(null);
  const [dbStates, setDbStates] = useState([]);
  const [dbDistricts, setDbDistricts] = useState([]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(accountSchema),
    mode: "onChange",
    defaultValues: {
      joiningAmount: String(member.AsthaDidiJoiningAmt || "5000"),
      walletBalance: String(member.AsthaDidiWalletBalance || "0"),
      fullName: member.AsthaDidiUserName || "",
      sdwOf: member.AsthaDidiGuardianName || "",
      dob: member.AsthaDidiDOB
        ? String(member.AsthaDidiDOB).substring(0, 10)
        : "",
      guardianContactNo: member.AsthaDidiGuardianContactNo || "",
      state: null,
      district: null,
      city: member.AsthaDidiCity || "",
      block: member.AsthaDidiBlockName || "",
      postOffice: member.AsthaDidiPO || "",
      policeStation: member.AsthaDidiPS || "",
      gramPanchayet: member.AsthaDidiGramPanchayet || "",
      village: member.AsthaDidiVillage || "",
      pinCode: String(member.AsthaDidiPincode || ""),
      mobileNo: member.AsthaDidiContactNo || "",
      email: member.AsthaDidiSignupEmail || member.AsthaDidiMailId || "",
      userName: member.AsthaDidiSignupUserName || "",
      password: member.AsthaDidiSignupPassword || "",
      bankName: member.AsthaDidiBankName || "",
      branchName: member.AsthaDidiBranchName || "",
      accountNo: member.AsthaDidiBankAcctNo || "",
      ifsCode: member.AsthaDidiIFSCode || "",
      panNo: member.AsthaDidiPanNo || "",
      aadharNo: member.AsthaDidiAadharNo || "",
      deactivateConfirm: false,
    },
  });

  const selectedState = watch("state");

  useEffect(() => {
    const initializeAddressFields = async () => {
      try {
        const stateRes = await fetch(`${API_BASE_URL}/states`);
        const stateData = await stateRes.json();
        const formattedStates = stateData.map((s) => ({
          value: s.StateId,
          label: s.StateName,
        }));
        setDbStates(formattedStates);

        if (member.AsthaDidiStateName) {
          const matchedState = formattedStates.find(
            (s) => s.label.trim() === member.AsthaDidiStateName.trim(),
          );
          if (matchedState) {
            setValue("state", matchedState);

            const distRes = await fetch(
              `${API_BASE_URL}/districts/${matchedState.value}`,
            );
            const distData = await distRes.json();
            const formattedDistricts = distData.map((d) => ({
              value: d.DistId,
              label: d.DistName,
            }));
            setDbDistricts(formattedDistricts);

            if (member.AsthaDidiDistName) {
              const matchedDist = formattedDistricts.find(
                (d) => d.label.trim() === member.AsthaDidiDistName.trim(),
              );
              if (matchedDist) {
                setValue("district", matchedDist);
              }
            }
          }
        }
      } catch (err) {
        console.error("Initialization error in Astha Didi Modal:", err);
      }
    };

    initializeAddressFields();
  }, [member, setValue]);

  useEffect(() => {
    if (selectedState && selectedState.value) {
      fetch(`${API_BASE_URL}/districts/${selectedState.value}`)
        .then((res) => res.json())
        .then((data) => {
          const formattedDistricts = data.map((d) => ({
            value: d.DistId,
            label: d.DistName,
          }));
          setDbDistricts(formattedDistricts);
        })
        .catch(() => {});
    }
  }, [selectedState]);

  const handleUploadClick = () => {
    if (!isView && fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    if (isView) return;
    const file = event.target.files[0];
    if (file) {
      if (file.size > 800000) return toast.warning("Image size exceeds 800KB.");
      const reader = new FileReader();
      reader.onloadend = () => setProfileImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleResetImage = () => {
    if (isView) return;
    setProfileImage(DUMMY_AVATAR);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (data) => {
    const isEdit = !!member?.AsthaDidiRegId;
    const checks = [
      {
        table: "asthadidi_reg",
        column: "AsthaDidiMailId",
        value: data.email,
        idColumn: isEdit ? "AsthaDidiRegId" : null,
        idValue: isEdit ? member.AsthaDidiRegId : null,
        label: "Email ID",
      },
      {
        table: "asthadidi_reg",
        column: "AsthaDidiSignupUserName",
        value: data.userName,
        idColumn: isEdit ? "AsthaDidiRegId" : null,
        idValue: isEdit ? member.AsthaDidiRegId : null,
        label: "Username",
      },
      {
        table: "asthadidi_reg",
        column: "AsthaDidiAadharNo",
        value: data.aadharNo,
        idColumn: isEdit ? "AsthaDidiRegId" : null,
        idValue: isEdit ? member.AsthaDidiRegId : null,
        label: "Aadhar No",
      },
    ];
    if (!(await validateUniqueFields(checks))) return;

    try {
      toast.loading("Checking GP slot availability...", {
        toastId: "slotCheck",
      });
      const didiRes = await fetch(`${API_BASE_URL}/asthadidi`);
      const allDidis = await didiRes.json();
      toast.dismiss("slotCheck");

      const gpCount = allDidis.filter(
        (d) =>
          d.AsthaDidiRegId !== member.AsthaDidiRegId &&
          d.AsthaDidiBlockName?.trim().toLowerCase() ===
            data.block.trim().toLowerCase() &&
          d.AsthaDidiGramPanchayet?.trim().toLowerCase() ===
            data.gramPanchayet.trim().toLowerCase() &&
          String(d.AsthaDidiIsActive) !== "0",
      ).length;

      if (gpCount >= 3) {
        toast.error(
          "NO Slots: This Gram Panchayet already has 3 Astha Didis assigned.",
          { autoClose: 6000 },
        );
        return;
      }
    } catch (err) {
      toast.dismiss("slotCheck");
      toast.error("Network error while checking slot availability.");
      return;
    }

    const stateName = data.state ? data.state.label : "";
    const districtName = data.district ? data.district.label : "";
    const loggedInUser = getSafeUser();
    const currentUserId = loggedInUser
      ? loggedInUser.UserSignUpId || loggedInUser.id
      : null;

    const dbPayload = {
      ...member,
      AsthaDidiProfileImage:
        profileImage === DUMMY_AVATAR ? null : profileImage,
      AsthaDidiUserName: data.fullName,
      AsthaDidiGuardianName: data.sdwOf || "",
      AsthaDidiDOB: data.dob,
      AsthaDidiGuardianContactNo: data.guardianContactNo || "",
      AsthaDidiStateName: stateName,
      AsthaDidiDistName: districtName,
      AsthaDidiCity: data.city || "",
      AsthaDidiBlockName: data.block || "",
      AsthaDidiPO: data.postOffice || "",
      AsthaDidiPS: data.policeStation || "",
      AsthaDidiGramPanchayet: data.gramPanchayet || "",
      AsthaDidiVillage: data.village || "",
      AsthaDidiPincode: parseInt(data.pinCode),
      AsthaDidiContactNo: data.mobileNo,
      AsthaDidiMailId: data.email,
      AsthaDidiSignupUserName: data.userName,
      AsthaDidiSignupEmail: data.email,
      AsthaDidiSignupPassword: data.password,
      AsthaDidiBankName: data.bankName || "",
      AsthaDidiBranchName: data.branchName || "",
      AsthaDidiBankAcctNo: data.accountNo || "0",
      AsthaDidiIFSCode: data.ifsCode || "",
      AsthaDidiPanNo: data.panNo || "",
      AsthaDidiAadharNo: data.aadharNo,
      AsthaDidiJoiningAmt: parseInt(data.joiningAmount) || 5000,
      AsthaDidiWalletBalance: parseInt(data.walletBalance) || 0,
      AsthaDidiCreatedByAuthRegId: currentUserId,
    };

    if (dbPayload.AsthaDidiDOB)
      dbPayload.AsthaDidiDOB = String(dbPayload.AsthaDidiDOB).substring(0, 10);

    try {
      toast.loading("Updating member...", { toastId: "update" });
      const res = await fetch(
        `${API_BASE_URL}/asthadidi/${member.AsthaDidiRegId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dbPayload),
        },
      );
      toast.dismiss("update");
      if (res.ok) {
        toast.success("Member updated successfully!");
        onSuccess();
      } else {
        toast.error("Failed to update.");
      }
    } catch (error) {
      toast.dismiss("update");
      toast.error("Network error.");
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modalContent, maxWidth: "1000px", padding: "0" }}>
        <div style={styles.cardHeader}>
          <h5 style={{ margin: 0 }}>
            {isView ? "View" : "Edit"} Astha Didi Details
          </h5>
          <button style={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>
        <div style={styles.cardBody}>
          <div style={styles.profileSection}>
            <img
              src={profileImage}
              alt="Profile Avatar"
              style={styles.avatar}
            />
            <div>
              <p style={styles.hintText}>
                <strong>Status:</strong>{" "}
                {Number(member.AsthaDidiIsActive) === 2
                  ? "Approved"
                  : "Pending"}
              </p>
              {Number(member.AsthaDidiIsActive) === 2 &&
                member.AsthaDidiAprovedBy && (
                  <>
                    <p style={styles.hintText}>
                      <strong>Approved By:</strong>{" "}
                      {member.ApproverDisplayName || member.AsthaDidiAprovedBy}
                    </p>
                    <p style={styles.hintText}>
                      <strong>Approval Date:</strong>{" "}
                      {formatDisplayDate(member.AsthaDidiAprovalDate)}
                    </p>
                  </>
                )}
              {!isView && (
                <div style={styles.buttonGroup}>
                  <button
                    type="button"
                    style={styles.btnOutline}
                    onClick={handleUploadClick}
                  >
                    Change photo
                  </button>
                  <button
                    type="button"
                    style={styles.btnOutline}
                    onClick={handleResetImage}
                  >
                    Reset
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/gif"
                    style={{ display: "none" }}
                  />
                </div>
              )}
            </div>
          </div>
          <form
            onSubmit={handleSubmit(
              onSubmit,
              () => !isView && toast.error("Check red fields!"),
            )}
          >
            <h6 style={styles.sectionHeader}>Astha Didi Information</h6>
            <div style={styles.formGrid}>
              <Controller
                name="joiningAmount"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Joining Amount *"
                    id="edit_joiningAmount"
                    error={errors.joiningAmount}
                    disabled={true}
                    {...field}
                  />
                )}
              />
              <Controller
                name="walletBalance"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Wallet Balance *"
                    id="edit_walletBalance"
                    error={errors.walletBalance}
                    disabled={true}
                    {...field}
                  />
                )}
              />
            </div>
            <h6 style={styles.sectionHeader}>Personal Details</h6>
            <div style={styles.formGrid}>
              <Controller
                name="fullName"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Full Name *"
                    id="edit_fullName"
                    error={errors.fullName}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="sdwOf"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="S/D/W of"
                    id="edit_sdwOf"
                    error={errors.sdwOf}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="dob"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Date of Birth *"
                    id="edit_dob"
                    error={errors.dob}
                    type="date"
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="guardianContactNo"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Guardian Contact no *"
                    id="edit_guardianContactNo"
                    error={errors.guardianContactNo}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
            </div>
            <h6 style={styles.sectionHeader}>Postal Address Information</h6>
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Select State *</label>
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={dbStates}
                      placeholder={member.AsthaDidiStateName || "Select..."}
                      styles={{
                        ...styles.selectStyles(!!errors.state),
                        menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                        menu: (base) => ({ ...base, zIndex: 99999 }),
                      }}
                      isDisabled={isReadOnlyField}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  )}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>District *</label>
                <Controller
                  name="district"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={dbDistricts}
                      placeholder={member.AsthaDidiDistName || "Select..."}
                      styles={{
                        ...styles.selectStyles(!!errors.district),
                        menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                        menu: (base) => ({ ...base, zIndex: 99999 }),
                      }}
                      isDisabled={isReadOnlyField}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  )}
                />
              </div>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="City"
                    id="edit_city"
                    error={errors.city}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="block"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Block *"
                    id="edit_block"
                    error={errors.block}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="postOffice"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Post Office"
                    id="edit_postOffice"
                    error={errors.postOffice}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="policeStation"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Police Station"
                    id="edit_policeStation"
                    error={errors.policeStation}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="gramPanchayet"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Gram Panchayet *"
                    id="edit_gramPanchayet"
                    error={errors.gramPanchayet}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="village"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Village *"
                    id="edit_village"
                    error={errors.village}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="pinCode"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Pin Code *"
                    id="edit_pinCode"
                    error={errors.pinCode}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="mobileNo"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Contact Number *"
                    id="edit_mobileNo"
                    error={errors.mobileNo}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
            </div>
            <h6 style={styles.sectionHeader}>Login & Account Setup</h6>
            <div style={styles.formGrid}>
              <Controller
                name="userName"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label={
                      <>
                        User Name <span style={{ color: "#ff3e1d" }}>*</span>
                      </>
                    }
                    id="edit_userName"
                    error={errors.userName}
                    disabled={isView}
                    type="text"
                    readOnly
                    {...field}
                  />
                )}
              />
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label={
                      <>
                        Email ID (For Login){" "}
                        <span style={{ color: "#ff3e1d" }}>*</span>
                      </>
                    }
                    id="edit_email"
                    error={errors.email}
                    disabled
                    readOnly
                    type="email"
                    maxLength={100}
                    {...field}
                  />
                )}
              />
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <PasswordInput
                    label={
                      <>
                        Set New Password{" "}
                        <span style={{ color: "#ff3e1d" }}>*</span>
                      </>
                    }
                    id="edit_password"
                    error={errors.password}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
            </div>
            <h6 style={styles.sectionHeader}>Banking & Payment Details</h6>
            <div style={styles.formGrid}>
              <Controller
                name="bankName"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Bank Name"
                    id="edit_bankName"
                    error={errors.bankName}
                    disabled={isView}
                    readOnly={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="branchName"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Branch Name"
                    id="edit_branchName"
                    error={errors.branchName}
                    disabled={isView}
                    readOnly={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="accountNo"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Account No"
                    id="edit_accountNo"
                    error={errors.accountNo}
                    disabled={isView}
                    readOnly={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="ifsCode"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="IFS Code"
                    id="edit_ifsCode"
                    error={errors.ifsCode}
                    disabled={isView}
                    readOnly={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="panNo"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="PAN No"
                    id="edit_panNo"
                    error={errors.panNo}
                    disabled={isView}
                    readOnly={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="aadharNo"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Aadhar No *"
                    id="edit_aadharNo"
                    error={errors.aadharNo}
                    disabled={isView}
                    readOnly={isView}
                    {...field}
                  />
                )}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "32px",
                gap: "10px",
              }}
            >
              <button type="button" style={styles.btnOutline} onClick={onClose}>
                {isView ? "Close" : "Cancel"}
              </button>
              {!isView && (
                <button type="submit" style={styles.btnPrimary}>
                  Save Changes
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const MembersTable = ({ refreshTrigger, externalFilters }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [userProfileId, setUserProfileId] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortConfig, setSortConfig] = useState(null);

  const [globalSearch, setGlobalSearch] = useState("");

  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [approveModal, setApproveModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [approvalData, setApprovalData] = useState({ id: "", dbDate: "" });

  useEffect(() => {
    const user = getSafeUser();
    if (user) {
      setUserRole(user.role || user.UserSignUpRole || "");
      setUserName(user.username || "");
      setUserId(user.UserSignUpId || user.id || "");
      setUserProfileId(user.ProfileRegId || "");
    }
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/asthadidi`);
      if (!res.ok) throw new Error("Failed to fetch table data");
      let data = await res.json();
      data = data.filter((member) => String(member.AsthaDidiIsActive) !== "0");

      const user = getSafeUser();
      if (user) {
        const currentRole = user.role || user.UserSignUpRole || "";
        const currentProfileId = String(user.ProfileRegId || "");

        if (currentRole === "Astha Didi") {
          data = data.filter(
            (member) => String(member.AsthaDidiRegId) === currentProfileId,
          );
        } else if (currentRole === "Supervisor" && currentProfileId) {
          data = data.filter(
            (member) => String(member.SupRegId) === currentProfileId,
          );
        }
      }
      setMembers(data);
    } catch (error) {
      toast.error("Failed to load table data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [refreshTrigger]);

  const filteredMembers = useMemo(() => {
    const isNationalNgo = (userRole || "").toLowerCase() === "national ngo";
    if (
      [
        "National NGO",
        "State Super Administrator",
        "District Administrator",
      ].includes(userRole)
    ) {
      if (
        (isNationalNgo && !externalFilters?.filterStateNgo) ||
        !externalFilters?.filterMotherNgo ||
        !externalFilters?.filterState ||
        !externalFilters?.filterDistrict ||
        !externalFilters?.filterSupervisor
      ) {
        return [];
      }
    }

    return members.filter((member) => {
      let matchesSearch = true;
      if (globalSearch) {
        const searchLower = globalSearch.toLowerCase();
        matchesSearch = Object.values(member).some(
          (val) => val && String(val).toLowerCase().includes(searchLower),
        );
      }

      let matchesState = true;
      if (externalFilters?.filterState) {
        const dbState = member.AsthaDidiStateName
          ? String(member.AsthaDidiStateName).trim().toLowerCase()
          : "";
        const filterState = String(externalFilters.filterState.label)
          .trim()
          .toLowerCase();
        matchesState = dbState === filterState;
      }

      let matchesDistrict = true;
      if (externalFilters?.filterDistrict) {
        const dbDist = member.AsthaDidiDistName
          ? String(member.AsthaDidiDistName).trim().toLowerCase()
          : "";
        const filterDist = String(externalFilters.filterDistrict.label)
          .trim()
          .toLowerCase();
        matchesDistrict = dbDist === filterDist;
      }

      let matchesMotherNgo = true;
      if (externalFilters?.filterMotherNgo) {
        const dbDist = member.AsthaDidiDistName
          ? String(member.AsthaDidiDistName).trim().toLowerCase()
          : "";
        const ngoDist = externalFilters.filterMotherNgo.districtName
          ? String(externalFilters.filterMotherNgo.districtName)
              .trim()
              .toLowerCase()
          : "";
        matchesMotherNgo =
          member.DistNGORegId != null
            ? String(member.DistNGORegId) ===
              String(externalFilters.filterMotherNgo.value)
            : dbDist === ngoDist;
      }

      let matchesStateNgo = true;
      if (externalFilters?.filterStateNgo) {
        const rowStateNgoId =
          member.StateNGORegId || member.ResolvedStateNGORegId;
        matchesStateNgo =
          String(rowStateNgoId) ===
          String(externalFilters.filterStateNgo.value);
      }

      let matchesSupervisor = true;
      if (userRole === "Supervisor") {
        matchesSupervisor = String(member.SupRegId) === String(userProfileId);
      } else if (externalFilters?.filterSupervisor) {
        matchesSupervisor =
          String(member.SupRegId) ===
          String(externalFilters.filterSupervisor.value);
      }

      return (
        matchesSearch &&
        matchesStateNgo &&
        matchesState &&
        matchesDistrict &&
        matchesMotherNgo &&
        matchesSupervisor
      );
    });
  }, [members, globalSearch, externalFilters, userRole, userProfileId]);

  const sortedMembers = useMemo(() => {
    let sortableItems = [...filteredMembers];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key] || "";
        let bVal = b[sortConfig.key] || "";
        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredMembers, sortConfig]);

  const requestSort = (key) => {
    let direction = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    )
      direction = "descending";
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName) => {
    if (!sortConfig || sortConfig.key !== columnName)
      return <span style={{ opacity: 0.3, marginLeft: "4px" }}>↕</span>;
    return sortConfig.direction === "ascending" ? (
      <span style={{ marginLeft: "4px" }}>▲</span>
    ) : (
      <span style={{ marginLeft: "4px" }}>▼</span>
    );
  };

  const totalPages = Math.max(1, Math.ceil(sortedMembers.length / rowsPerPage));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [sortedMembers.length, totalPages, currentPage]);

  const indexOfLastMember = currentPage * rowsPerPage;
  const indexOfFirstMember = indexOfLastMember - rowsPerPage;
  const currentMembers = sortedMembers.slice(
    indexOfFirstMember,
    indexOfLastMember,
  );
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleRowsChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const openModal = async (type, member) => {
    setSelectedRow({ ...member });
    if (type === "view") setViewModal(true);
    if (type === "edit") setEditModal(true);
    if (type === "delete") setDeleteModal(true);
    if (type === "approve") {
      setApproveModal(true);
      setApprovalData({ id: "Generating...", dbDate: "" });

      const d = new Date();
      const utc = d.getTime() + d.getTimezoneOffset() * 60000;
      const istDate = new Date(utc + 3600000 * 5.5);
      const dbDate = istDate.toISOString().split("T")[0];

      let stateId = "00";
      let distId = "00";
      try {
        const stateRes = await fetch(`${API_BASE_URL}/states`);
        const states = await stateRes.json();
        const stateObj = states.find(
          (s) => s.StateName === member.AsthaDidiStateName,
        );
        if (stateObj) {
          stateId = String(stateObj.StateId).padStart(2, "0");
          const distRes = await fetch(
            `${API_BASE_URL}/districts/${stateObj.StateId}`,
          );
          const dists = await distRes.json();
          const distObj = dists.find(
            (d) => d.DistName === member.AsthaDidiDistName,
          );
          if (distObj) distId = String(distObj.DistId).padStart(2, "0");
        }
      } catch (e) {
        console.error("Error generating ID:", e);
      }

      const aadhar = member.AsthaDidiAadharNo || "000000000000";
      setApprovalData({ id: `${stateId}${distId}${aadhar}`, dbDate });
    }
  };

  const closeModal = () => {
    setViewModal(false);
    setEditModal(false);
    setDeleteModal(false);
    setApproveModal(false);
    setSelectedRow(null);
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Deleting...", { toastId: "delete" });
      const payload = { ...selectedRow, AsthaDidiIsActive: "0" };
      Object.keys(payload).forEach((key) => {
        if (
          key !== "AsthaDidiAprovalDate" &&
          typeof payload[key] === "string" &&
          /^\d{4}-\d{2}-\d{2}T/.test(payload[key])
        ) {
          payload[key] = payload[key].substring(0, 10);
        }
      });
      const res = await fetch(
        `${API_BASE_URL}/asthadidi/${selectedRow.AsthaDidiRegId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      toast.dismiss("delete");
      if (res.ok) {
        toast.success("Member deleted.");
        setMembers((prev) =>
          prev.filter((m) => m.AsthaDidiRegId !== selectedRow.AsthaDidiRegId),
        );
        closeModal();
      } else {
        toast.error("Failed to delete.");
      }
    } catch (error) {
      toast.dismiss("delete");
      toast.error("Network error.");
    }
  };

  const confirmApprove = async () => {
    try {
      toast.loading("Approving...", { toastId: "approve" });
      const payload = {
        ...selectedRow,
        AsthaDidiIsActive: 2,
        AsthaDidiRegNo: approvalData.id,
        AsthaDidiAprovalDate: approvalData.dbDate,
        AsthaDidiAprovedBy: String(userId),
      };
      Object.keys(payload).forEach((key) => {
        if (
          key !== "AsthaDidiAprovalDate" &&
          typeof payload[key] === "string" &&
          /^\d{4}-\d{2}-\d{2}T/.test(payload[key])
        ) {
          payload[key] = payload[key].substring(0, 10);
        }
      });
      const res = await fetch(
        `${API_BASE_URL}/asthadidi/${selectedRow.AsthaDidiRegId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      toast.dismiss("approve");
      if (res.ok) {
        toast.success(`Member Approved! ID: ${approvalData.id}`);
        closeModal();
        fetchMembers();
      } else {
        toast.error("Failed to approve.");
      }
    } catch (error) {
      toast.dismiss("approve");
      toast.error("Network error.");
    }
  };

  const renderTh = (
    label,
    key,
    isStickyLeft = false,
    isStickyRight = false,
  ) => {
    let thStyle = { ...styles.th };
    if (isStickyLeft) thStyle = { ...styles.stickyLeftTh };
    if (isStickyRight) thStyle = { ...styles.stickyRightTh };
    return (
      <th style={thStyle} onClick={() => requestSort(key)}>
        {label} {getSortIcon(key)}
      </th>
    );
  };

  return (
    <div style={{ ...styles.card, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px 24px 0 24px",
        }}
      >
        <h5 style={styles.cardHeader}>Profile Details & Activity:</h5>
        <button onClick={fetchMembers} style={styles.btnOutline}>
          Refresh Data
        </button>
      </div>
      <div style={styles.cardBody}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            marginBottom: "20px",
            paddingBottom: "20px",
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="🔍 Search entire table..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              style={{ ...styles.input(false), flex: 1, padding: "8px 12px" }}
            />
          </div>
        </div>

        {loading ? (
          <p>Loading data...</p>
        ) : (
          <>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {renderTh("Profile", "AsthaDidiProfileImage", true)}
                    {renderTh("Full Name", "AsthaDidiUserName")}
                    {renderTh("S/D/W Of", "AsthaDidiGuardianName")}
                    {renderTh("DOB", "AsthaDidiDOB")}
                    {renderTh("Guardian Contact", "AsthaDidiGuardianContactNo")}
                    {renderTh("Mobile No", "AsthaDidiContactNo")}
                    {renderTh("Email ID", "AsthaDidiMailId")}
                    {renderTh("User Name", "AsthaDidiSignupUserName")}
                    {renderTh("Password", "AsthaDidiSignupPassword")}
                    {renderTh("State", "AsthaDidiStateName")}
                    {renderTh("District", "AsthaDidiDistName")}
                    {renderTh("City", "AsthaDidiCity")}
                    {renderTh("Block", "AsthaDidiBlockName")}
                    {renderTh("Post Office", "AsthaDidiPO")}
                    {renderTh("Police Station", "AsthaDidiPS")}
                    {renderTh("Gram Panchayet", "AsthaDidiGramPanchayet")}
                    {renderTh("Village", "AsthaDidiVillage")}
                    {renderTh("Pin Code", "AsthaDidiPincode")}
                    {renderTh("Bank Name", "AsthaDidiBankName")}
                    {renderTh("Branch Name", "AsthaDidiBranchName")}
                    {renderTh("Account No", "AsthaDidiBankAcctNo")}
                    {renderTh("IFS Code", "AsthaDidiIFSCode")}
                    {renderTh("PAN No", "AsthaDidiPanNo")}
                    {renderTh("Aadhar No", "AsthaDidiAadharNo")}
                    {renderTh("Joining Amt", "AsthaDidiJoiningAmt")}
                    {renderTh("Wallet Bal", "AsthaDidiWalletBalance")}
                    {renderTh("Status", "AsthaDidiIsActive")}
                    {renderTh("Approved By", "ApproverDisplayName")}
                    {renderTh("Approval Date", "AsthaDidiAprovalDate")}
                    {renderTh("Approval Reg No", "AsthaDidiRegNo")}
                    <th style={styles.stickyRightTh}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMembers.map((row) => (
                    <tr key={row.AsthaDidiRegId}>
                      <td style={styles.stickyLeftTd}>
                        <img
                          src={
                            extractBase64(row.AsthaDidiProfileImage) ||
                            DUMMY_AVATAR
                          }
                          alt="User"
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      </td>
                      <td style={styles.td}>{row.AsthaDidiUserName}</td>
                      <td style={styles.td}>{row.AsthaDidiGuardianName}</td>
                      <td style={styles.td}>
                        {formatDisplayDate(row.AsthaDidiDOB)}
                      </td>
                      <td style={styles.td}>
                        {row.AsthaDidiGuardianContactNo}
                      </td>
                      <td style={styles.td}>{row.AsthaDidiContactNo}</td>
                      <td style={styles.td}>{row.AsthaDidiMailId}</td>
                      <td style={styles.td}>
                        {row.AsthaDidiSignupUserName || "-"}
                      </td>
                      <td style={styles.td}>
                        {row.AsthaDidiSignupPassword || "-"}
                      </td>
                      <td style={styles.td}>{row.AsthaDidiStateName}</td>
                      <td style={styles.td}>{row.AsthaDidiDistName}</td>
                      <td style={styles.td}>{row.AsthaDidiCity}</td>
                      <td style={styles.td}>{row.AsthaDidiBlockName}</td>
                      <td style={styles.td}>{row.AsthaDidiPO}</td>
                      <td style={styles.td}>{row.AsthaDidiPS}</td>
                      <td style={styles.td}>{row.AsthaDidiGramPanchayet}</td>
                      <td style={styles.td}>{row.AsthaDidiVillage}</td>
                      <td style={styles.td}>{row.AsthaDidiPincode}</td>
                      <td style={styles.td}>{row.AsthaDidiBankName}</td>
                      <td style={styles.td}>{row.AsthaDidiBranchName}</td>
                      <td style={styles.td}>{row.AsthaDidiBankAcctNo}</td>
                      <td style={styles.td}>{row.AsthaDidiIFSCode}</td>
                      <td style={styles.td}>{row.AsthaDidiPanNo}</td>
                      <td style={styles.td}>{row.AsthaDidiAadharNo}</td>
                      <td style={styles.td}>₹{row.AsthaDidiJoiningAmt}</td>
                      <td style={styles.td}>₹{row.AsthaDidiWalletBalance}</td>
                      <td
                        style={{
                          ...styles.td,
                          color:
                            Number(row.AsthaDidiIsActive) === 2
                              ? "green"
                              : "orange",
                          fontWeight: "bold",
                        }}
                      >
                        {Number(row.AsthaDidiIsActive) === 2
                          ? "Approved"
                          : "Pending"}
                      </td>
                      <td style={styles.td}>
                        {row.ApproverDisplayName ||
                          row.AsthaDidiAprovedBy ||
                          "-"}
                      </td>
                      <td style={styles.td}>
                        {formatDisplayDate(row.AsthaDidiAprovalDate)}
                      </td>
                      <td style={styles.td}>{row.AsthaDidiRegNo || "-"}</td>
                      <td style={styles.stickyRightTd}>
                        <button
                          onClick={() => openModal("view", row)}
                          style={styles.actionBtn}
                        >
                          👁️
                        </button>
                        {/* ✅ FIXED: Super Admin, District Administrator, and Supervisor can edit */}
                        {[
                          "national ngo",
                          "state super administrator",
                          "district administrator",
                          "supervisor",
                        ].includes((userRole || "").toLowerCase()) && (
                          <button
                            onClick={() => openModal("edit", row)}
                            style={styles.actionBtn}
                          >
                            ✏️
                          </button>
                        )}
                        {/* ✅ FIXED: Super Admin can delete */}
                        {["national ngo", "state super administrator"].includes(
                          (userRole || "").toLowerCase(),
                        ) && (
                          <button
                            onClick={() => openModal("delete", row)}
                            style={styles.actionBtn}
                          >
                            🗑️
                          </button>
                        )}
                        {/* ✅ FIXED: Super Admin, District Administrator, and Supervisor can approve */}
                        {Number(row.AsthaDidiIsActive) !== 2 &&
                          [
                            "national ngo",
                            "state super administrator",
                            "district administrator",
                            "supervisor",
                          ].includes((userRole || "").toLowerCase()) && (
                            <button
                              onClick={() => openModal("approve", row)}
                              style={styles.actionBtn}
                            >
                              ✅
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={styles.paginationContainer}>
              <div>
                <span>Rows per page: </span>
                <select
                  value={rowsPerPage}
                  onChange={handleRowsChange}
                  style={styles.pageSelect}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
              <div>
                <span style={{ marginRight: "16px" }}>
                  Showing{" "}
                  {sortedMembers.length === 0 ? 0 : indexOfFirstMember + 1} to{" "}
                  {Math.min(indexOfLastMember, sortedMembers.length)} of{" "}
                  {sortedMembers.length}
                </span>
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  style={
                    currentPage === 1 ? styles.pageBtnDisabled : styles.pageBtn
                  }
                >
                  Prev
                </button>
                <span style={{ margin: "0 12px" }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={
                    currentPage === totalPages || totalPages === 0
                      ? styles.pageBtnDisabled
                      : styles.pageBtn
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {viewModal && selectedRow && (
        <AsthaDidiModal
          member={selectedRow}
          mode="view"
          onClose={closeModal}
          onSuccess={closeModal}
        />
      )}
      {editModal && selectedRow && (
        <AsthaDidiModal
          member={selectedRow}
          mode="edit"
          onClose={closeModal}
          onSuccess={() => {
            closeModal();
            fetchMembers();
          }}
        />
      )}
      {deleteModal && selectedRow && (
        <div style={styles.modalOverlay}>
          <div
            style={{
              ...styles.modalContent,
              maxWidth: "400px",
              textAlign: "center",
            }}
          >
            <h4 style={{ color: "#ff3e1d" }}>Confirm Delete</h4>
            <p>
              Delete <strong>{selectedRow.AsthaDidiUserName}</strong>?
            </p>
            <div style={styles.modalActions}>
              <button onClick={closeModal} style={styles.btnOutline}>
                Cancel
              </button>
              <button onClick={confirmDelete} style={styles.btnDanger}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {approveModal && selectedRow && (
        <div style={styles.modalOverlay}>
          <div
            style={{
              ...styles.modalContent,
              maxWidth: "500px",
              textAlign: "center",
            }}
          >
            <h4 style={{ color: "#71dd37", marginBottom: "16px" }}>
              Approve Astha Didi
            </h4>
            <div
              style={{
                textAlign: "left",
                background: "#f8f9fa",
                padding: "16px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "0.9rem",
                color: "#566a7f",
                lineHeight: "1.8",
              }}
            >
              <p style={{ margin: 0 }}>
                <strong>Candidate Name:</strong> {selectedRow.AsthaDidiUserName}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Aadhaar Number:</strong>{" "}
                {selectedRow.AsthaDidiAadharNo || "N/A"}
              </p>
              <p style={{ margin: 0 }}>
                <strong>State:</strong> {selectedRow.AsthaDidiStateName}
              </p>
              <p style={{ margin: 0 }}>
                <strong>District:</strong> {selectedRow.AsthaDidiDistName}
              </p>
              <hr />
              <p style={{ margin: 0 }}>
                <strong>Approving Authority:</strong> {userName}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Approval Date:</strong> {approvalData.dbDate}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Approval ID:</strong>{" "}
                <span style={{ color: "#696cff", fontWeight: "bold" }}>
                  {approvalData.id}
                </span>
              </p>
            </div>
            <div style={styles.modalActions}>
              <button onClick={closeModal} style={styles.btnOutline}>
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                style={styles.btnSuccess}
                disabled={approvalData.id === "Generating..."}
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersTable;

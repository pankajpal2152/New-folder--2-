import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";
import { toast } from "react-toastify";
import {
  API_BASE_URL,
  styles,
  FormInput,
  fileToBase64,
} from "../config/constants";
import { ngoSchema } from "./forms/DistrictAdminForm";
import {
  getSafeUser,
  PasswordInput,
  handleViewPdf,
  validateUniqueFields,
} from "./AccountSharedUtils";

const formatDisplayDate = (dbDateStr) => {
  if (!dbDateStr) return "-";
  return String(dbDateStr).substring(0, 10);
};

const DistrictAdminModal = ({ member, mode, onClose, onSuccess }) => {
  const isView = mode === "view";
  const isReadOnlyField = isView || mode === "edit";

  const [dbStates, setDbStates] = useState([]);
  const [dbDistricts, setDbDistricts] = useState([]);

  const [regCertPdf, setRegCertPdf] = useState(
    member.DistNGORecCertificate || null,
  );
  const [panPdf, setPanPdf] = useState(member.DistNGOPanPic || null);
  const [darpanPdf, setDarpanPdf] = useState(member.DistNGODarpanPic || null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ngoSchema),
    mode: "onChange",
    defaultValues: {
      ngoName: member.DistNGOName || "",
      ngoRegistrationDate: member.DistNGORegDate
        ? String(member.DistNGORegDate).substring(0, 10)
        : "",
      ngoRegistrationNo: member.DistNGORegNo || "",
      ngoPanNo: member.DistNGOPanNo || "",
      ngoDarpanId: member.DistNGODarpanId || "",
      generalNgoEmail: member.DistNGOMailId || "",
      ngoMobile: member.DistNGOPhoneNo || "",
      ngoRegAddress: member.DistNGORegAddress || "",
      ngoWorkingAddress: member.DistNGOWorkingAddress || "",
      state: null,
      district: null,
      blockName: member.DistNGOBlockName || "",
      sdpName: member.DistNGOSDPName || "",
      secretaryEmail: member.DistNGOSDPMailId || "",
      secretaryMobile: member.DistNGOSDPPhoneNo || "",
      secretaryAadhar: member.DistNGOSDPAadhaarNo || "",
      bankAccountHolderName: member.DistNGOBankAcctHolderName || "",
      bankName: member.DistNGOBankName || "",
      accountNo: member.DistNGOAcctNo || "",
      ifsCode: member.DistNGOIFSCode || "",
      bankAddress: member.DistNGOBankAdd || "",
      userName: member.DistNGOSignupUserName || member.DistNGOName || "",
      password: member.DistNGOSignupPassword || "",
      ngoEmail: member.DistNGOSignupEmail || member.DistNGOMailId || "",
    },
  });

  const selectedState = watch("state");
  const ngoNameValue = watch("ngoName");

  useEffect(() => {
    if (!isView) {
      setValue("userName", ngoNameValue || "", { shouldValidate: true });
    }
  }, [ngoNameValue, setValue, isView]);

  useEffect(() => {
    const initializeModalData = async () => {
      try {
        const stateRes = await fetch(`${API_BASE_URL}/states`);
        const stateData = await stateRes.json();
        const formattedStates = stateData.map((s) => ({
          value: s.StateId,
          label: s.StateName,
        }));
        setDbStates(formattedStates);

        if (member.DistNGOStateName) {
          const matchedState = formattedStates.find(
            (s) => s.label.trim() === member.DistNGOStateName.trim(),
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

            if (member.DistNGODistName) {
              const matchedDist = formattedDistricts.find(
                (d) => d.label.trim() === member.DistNGODistName.trim(),
              );
              if (matchedDist) {
                setValue("district", matchedDist);
              }
            }
          }
        }
      } catch (err) {
        console.error("Initialization Error:", err);
      }
    };

    initializeModalData();
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

  const handlePdfUpload = async (event, setPdfState) => {
    if (isView) return;
    const file = event.target.files[0];
    if (file) {
      if (file.type !== "application/pdf")
        return toast.warning("Only PDF allowed.");
      if (file.size > 5000000) return toast.warning("Max 5MB.");
      try {
        const b64 = await fileToBase64(file);
        setPdfState(b64);
      } catch (err) {
        toast.error("File reading error.");
      }
    }
  };

  const onSubmit = async (data) => {
    if (isView) {
      onClose();
      return;
    }

    const checks = [
      {
        table: "dist_ngo_reg",
        column: "DistNGOMailId",
        value: data.generalNgoEmail,
        idColumn: "DistNGORegId",
        idValue: member.DistNGORegId,
        label: "Email",
      },
      {
        table: "dist_ngo_reg",
        column: "DistNGOSignupUserName",
        value: data.userName,
        idColumn: "DistNGORegId",
        idValue: member.DistNGORegId,
        label: "Username",
      },
    ];
    if (!(await validateUniqueFields(checks))) return;

    const dbPayload = {
      ...member,
      DistNGOName: data.ngoName,
      DistNGORegDate: data.ngoRegistrationDate,
      DistNGORegNo: data.ngoRegistrationNo,
      DistNGOPanNo: data.ngoPanNo,
      DistNGODarpanId: data.ngoDarpanId,
      DistNGOMailId: data.generalNgoEmail,
      DistNGOPhoneNo: data.ngoMobile,
      DistNGORegAddress: data.ngoRegAddress,
      DistNGOWorkingAddress: data.ngoWorkingAddress,
      DistNGOStateName: data.state ? data.state.label : "",
      DistNGODistName: data.district ? data.district.label : "",
      DistNGOBlockName: data.blockName,
      DistNGOSDPName: data.sdpName,
      DistNGOSDPMailId: data.secretaryEmail,
      DistNGOSDPPhoneNo: data.secretaryMobile,
      DistNGOSDPAadhaarNo: data.secretaryAadhar,
      DistNGOBankAcctHolderName: data.bankAccountHolderName,
      DistNGOBankName: data.bankName,
      DistNGOAcctNo: data.accountNo,
      DistNGOIFSCode: data.ifsCode,
      DistNGOBankAdd: data.bankAddress,
      DistNGOSignupUserName: data.userName,
      DistNGOSignupEmail: data.ngoEmail,
      DistNGOSignupPassword: data.password,
      DistNGORecCertificate: regCertPdf,
      DistNGOPanPic: panPdf,
      DistNGODarpanPic: darpanPdf,
    };

    if (dbPayload.DistNGORegDate)
      dbPayload.DistNGORegDate = String(dbPayload.DistNGORegDate).substring(
        0,
        10,
      );

    try {
      toast.loading("Updating record...", { toastId: "updateNgo" });
      const res = await fetch(
        `${API_BASE_URL}/districtadmin/${member.DistNGORegId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dbPayload),
        },
      );
      toast.dismiss("updateNgo");
      if (res.ok) {
        toast.success("Record updated!");
        onSuccess();
      } else toast.error("Failed to update.");
    } catch (error) {
      toast.dismiss("updateNgo");
      toast.error("Network error.");
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modalContent, maxWidth: "1000px", padding: "0" }}>
        <div style={styles.cardHeader}>
          <h5 style={{ margin: 0 }}>
            {isView ? "View" : "Edit"} District Admin Record
          </h5>
          <button style={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>
        <div style={styles.cardBody}>
          <div style={styles.profileSection}>
            <div>
              <p style={styles.hintText}>
                <strong>Status:</strong>{" "}
                {Number(member.DistNGOIsActive) === 2 ? "Approved" : "Pending"}
              </p>
              {Number(member.DistNGOIsActive) === 2 &&
                member.DistNGOAprovedBy && (
                  <>
                    <p style={styles.hintText}>
                      <strong>Approved By:</strong>{" "}
                      {member.ApproverDisplayName || member.DistNGOAprovedBy}
                    </p>
                    <p style={styles.hintText}>
                      <strong>Approval Date:</strong>{" "}
                      {formatDisplayDate(member.DistNGOAprovedDate)}
                    </p>
                    <p style={styles.hintText}>
                      <strong>Approval ID:</strong>{" "}
                      {member.DistNGOGenRegNo || "-"}
                    </p>
                  </>
                )}
            </div>
          </div>
          <form
            onSubmit={handleSubmit(
              onSubmit,
              () => !isView && toast.error("Check errors!"),
            )}
          >
            <h6 style={styles.sectionHeader}>NGO Details</h6>
            <div style={styles.formGrid}>
              <Controller
                name="ngoName"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="NGO Full Name *"
                    id="e_ngoName"
                    error={errors.ngoName}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="ngoRegistrationDate"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Date of Registration *"
                    id="e_ngoRegDate"
                    type="date"
                    error={errors.ngoRegistrationDate}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="ngoRegistrationNo"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Registration No *"
                    id="e_ngoRegNo"
                    error={errors.ngoRegistrationNo}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="ngoPanNo"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="NGO PAN No *"
                    id="e_ngoPan"
                    error={errors.ngoPanNo}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="ngoDarpanId"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="NGO Darpan ID"
                    id="e_ngoDarpan"
                    error={errors.ngoDarpanId}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="generalNgoEmail"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="NGO General Email *"
                    id="e_generalNgoEmail"
                    type="email"
                    error={errors.generalNgoEmail}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="ngoMobile"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="NGO Mobile *"
                    id="e_ngoMobile"
                    type="tel"
                    error={errors.ngoMobile}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
            </div>
            <h6 style={styles.sectionHeader}>Address Details</h6>
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>State *</label>
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={dbStates}
                      placeholder={member.DistNGOStateName || "Select..."}
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
                      placeholder={member.DistNGODistName || "Select..."}
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
                name="blockName"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Block Name *"
                    id="e_block"
                    error={errors.blockName}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="ngoRegAddress"
                control={control}
                render={({ field }) => (
                  <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                    <label htmlFor="e_ngoRegAdd" style={styles.label}>
                      NGO Register Address{" "}
                      <span style={{ color: "#ff3e1d" }}>*</span>
                    </label>
                    <textarea
                      id="e_ngoRegAdd"
                      disabled={isView}
                      style={{
                        ...styles.input(!!errors.ngoRegAddress),
                        resize: "vertical",
                        minHeight: "80px",
                        backgroundColor: isView ? "#eceeef" : "#fff",
                      }}
                      {...field}
                    />
                    {errors.ngoRegAddress && (
                      <p style={styles.errorText}>
                        {errors.ngoRegAddress.message}
                      </p>
                    )}
                  </div>
                )}
              />
              <Controller
                name="ngoWorkingAddress"
                control={control}
                render={({ field }) => (
                  <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                    <label htmlFor="e_ngoWorkAdd" style={styles.label}>
                      NGO Working office full address{" "}
                      <span style={{ color: "#ff3e1d" }}>*</span>
                    </label>
                    <textarea
                      id="e_ngoWorkAdd"
                      disabled={isView}
                      style={{
                        ...styles.input(!!errors.ngoWorkingAddress),
                        resize: "vertical",
                        minHeight: "80px",
                        backgroundColor: isView ? "#eceeef" : "#fff",
                      }}
                      {...field}
                    />
                    {errors.ngoWorkingAddress && (
                      <p style={styles.errorText}>
                        {errors.ngoWorkingAddress.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
            <h6 style={styles.sectionHeader}>Secretary Details</h6>
            <div style={styles.formGrid}>
              <Controller
                name="sdpName"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Secretary Name *"
                    id="e_sdpName"
                    error={errors.sdpName}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="secretaryEmail"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Secretary Email *"
                    id="e_secEmail"
                    type="email"
                    error={errors.secretaryEmail}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="secretaryMobile"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Secretary Mobile *"
                    id="e_secMobile"
                    type="tel"
                    error={errors.secretaryMobile}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="secretaryAadhar"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Secretary Aadhaar *"
                    id="e_secAadhar"
                    error={errors.secretaryAadhar}
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
                    label="User Name *"
                    id="e_user"
                    error={errors.userName}
                    readOnly
                    disabled={true}
                    {...field}
                  />
                )}
              />
              <Controller
                name="ngoEmail"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Email ID (For Login) *"
                    id="e_loginEmail"
                    type="email"
                    error={errors.ngoEmail}
                    disabled
                    readOnly
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
                        Set Password <span style={{ color: "#ff3e1d" }}>*</span>
                      </>
                    }
                    id="e_pass"
                    error={errors.password}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
            </div>
            <h6 style={styles.sectionHeader}>Banking & Account Setup</h6>
            <div style={styles.formGrid}>
              <Controller
                name="bankAccountHolderName"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Account Holder Name"
                    id="e_acctHolder"
                    error={errors.bankAccountHolderName}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="bankName"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Bank Name"
                    id="e_bank"
                    error={errors.bankName}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="accountNo"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Account Number"
                    id="e_acct"
                    error={errors.accountNo}
                    disabled={isView}
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
                    id="e_ifs"
                    error={errors.ifsCode}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
              <Controller
                name="bankAddress"
                control={control}
                render={({ field }) => (
                  <FormInput
                    label="Bank Address"
                    id="e_bankAdd"
                    error={errors.bankAddress}
                    disabled={isView}
                    {...field}
                  />
                )}
              />
            </div>
            <h6 style={styles.sectionHeader}>Documents</h6>
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Reg Cert PDF *</label>
                {!isView && (
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => handlePdfUpload(e, setRegCertPdf)}
                    style={styles.input(false)}
                  />
                )}
                {regCertPdf ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginTop: "8px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleViewPdf(regCertPdf)}
                      style={{
                        ...styles.btnOutline,
                        padding: "4px 8px",
                        fontSize: "0.85rem",
                      }}
                    >
                      👁️ View PDF
                    </button>
                    {!isView && (
                      <span
                        style={{
                          ...styles.hintText,
                          color: "#71dd37",
                          marginLeft: "10px",
                          marginBottom: 0,
                        }}
                      >
                        ✅ Ready
                      </span>
                    )}
                  </div>
                ) : (
                  <p style={styles.hintText}>❌ Missing</p>
                )}
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>NGO PAN PDF *</label>
                {!isView && (
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => handlePdfUpload(e, setPanPdf)}
                    style={styles.input(false)}
                  />
                )}
                {panPdf ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginTop: "8px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleViewPdf(panPdf)}
                      style={{
                        ...styles.btnOutline,
                        padding: "4px 8px",
                        fontSize: "0.85rem",
                      }}
                    >
                      👁️ View PDF
                    </button>
                    {!isView && (
                      <span
                        style={{
                          ...styles.hintText,
                          color: "#71dd37",
                          marginLeft: "10px",
                          marginBottom: 0,
                        }}
                      >
                        ✅ Ready
                      </span>
                    )}
                  </div>
                ) : (
                  <p style={styles.hintText}>❌ Missing</p>
                )}
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Darpan PDF</label>
                {!isView && (
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => handlePdfUpload(e, setDarpanPdf)}
                    style={styles.input(false)}
                  />
                )}
                {darpanPdf ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginTop: "8px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleViewPdf(darpanPdf)}
                      style={{
                        ...styles.btnOutline,
                        padding: "4px 8px",
                        fontSize: "0.85rem",
                      }}
                    >
                      👁️ View PDF
                    </button>
                    {!isView && (
                      <span
                        style={{
                          ...styles.hintText,
                          color: "#71dd37",
                          marginLeft: "10px",
                          marginBottom: 0,
                        }}
                      >
                        ✅ Ready
                      </span>
                    )}
                  </div>
                ) : (
                  <p style={styles.hintText}>❌ Missing</p>
                )}
              </div>
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

const DistrictAdminTable = ({ refreshTrigger, externalFilters }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal states
  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [approveModal, setApproveModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [approvalData, setApprovalData] = useState({ id: "", dbDate: "" });

  useEffect(() => {
    const user = getSafeUser();
    if (user) {
      setUserRole(user.role || "");
      setUserId(user.UserSignUpId || user.id || "");
    }
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/districtadmin`);
      if (!res.ok) throw new Error("Failed to fetch data");
      let data = await res.json();
      data = data.filter((member) => String(member.DistNGOIsActive) !== "0");
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
    const isFiltersSelected =
      (!isNationalNgo || externalFilters?.filterStateNgo) &&
      externalFilters?.filterMotherNgo &&
      externalFilters?.filterState &&
      externalFilters?.filterDistrict;
    if (!isFiltersSelected) return [];

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
        const dbState = member.DistNGOStateName
          ? String(member.DistNGOStateName).trim().toLowerCase()
          : "";
        const filterState = String(externalFilters.filterState.label)
          .trim()
          .toLowerCase();
        matchesState = dbState === filterState;
      }

      let matchesDistrict = true;
      if (externalFilters?.filterDistrict) {
        const dbDist = member.DistNGODistName
          ? String(member.DistNGODistName).trim().toLowerCase()
          : "";
        const filterDist = String(externalFilters.filterDistrict.label)
          .trim()
          .toLowerCase();
        matchesDistrict = dbDist === filterDist;
      }

      let matchesStateNgo = true;
      if (externalFilters?.filterStateNgo) {
        matchesStateNgo =
          String(member.StateNGORegId) ===
          String(externalFilters.filterStateNgo.value);
      }

      let matchesMotherNgo = true;
      if (externalFilters?.filterMotherNgo) {
        matchesMotherNgo =
          String(member.DistNGORegId) ===
          String(externalFilters.filterMotherNgo.value);
      }

      return (
        matchesSearch &&
        matchesStateNgo &&
        matchesMotherNgo &&
        matchesState &&
        matchesDistrict
      );
    });
  }, [members, globalSearch, externalFilters, userRole]);

  // Pagination Calculation
  const totalPages = Math.max(
    1,
    Math.ceil(filteredMembers.length / rowsPerPage),
  );
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [filteredMembers.length, totalPages, currentPage]);

  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentTableData = filteredMembers.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

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
          (s) => s.StateName === member.DistNGOStateName,
        );
        if (stateObj) {
          stateId = String(stateObj.StateId).padStart(2, "0");
          const distRes = await fetch(
            `${API_BASE_URL}/districts/${stateObj.StateId}`,
          );
          const dists = await distRes.json();
          const distObj = dists.find(
            (d) => d.DistName === member.DistNGODistName,
          );
          if (distObj) {
            distId = String(distObj.DistId).padStart(2, "0");
          }
        }
      } catch (e) {
        console.error(e);
      }

      // Dynamic mapping to fetch exact database variable for Aadhaar
      const aadhar = member.DistNGOSDPAadhaarNo || "000000000000";
      const finalApprovalId = `${stateId}${distId}${aadhar}`;
      setApprovalData({ id: finalApprovalId, dbDate });
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
      toast.loading("Deleting...", { toastId: "deleteNgo" });
      const payload = { ...selectedRow, DistNGOIsActive: "0" };
      const res = await fetch(
        `${API_BASE_URL}/districtadmin/${selectedRow.DistNGORegId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      toast.dismiss("deleteNgo");
      if (res.ok) {
        toast.success("Record deleted.");
        setMembers((prev) =>
          prev.filter((m) => m.DistNGORegId !== selectedRow.DistNGORegId),
        );
        closeModal();
      } else {
        toast.error("Failed to delete.");
      }
    } catch (error) {
      toast.dismiss("deleteNgo");
      toast.error("Network error.");
    }
  };

  const confirmApprove = async () => {
    try {
      toast.loading("Approving...", { toastId: "approveNgo" });
      const payload = {
        ...selectedRow,
        DistNGOIsActive: 2,
        DistNGOGenRegNo: approvalData.id,
        DistNGOAprovedBy: String(userId),
      };
      const d = new Date();
      const utc = d.getTime() + d.getTimezoneOffset() * 60000;
      const istDate = new Date(utc + 3600000 * 5.5);
      payload.DistNGOAprovedDate = istDate.toISOString().split("T")[0];

      const res = await fetch(
        `${API_BASE_URL}/districtadmin/${selectedRow.DistNGORegId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      toast.dismiss("approveNgo");
      if (res.ok) {
        toast.success(`Record Approved! ID: ${approvalData.id}`);
        closeModal();
        fetchMembers();
      } else {
        toast.error("Failed to approve.");
      }
    } catch (error) {
      toast.dismiss("approveNgo");
      toast.error("Network error.");
    }
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
        <h5 style={styles.cardHeader}>District Administrators:-</h5>
        <button onClick={fetchMembers} style={styles.btnOutline}>
          Refresh Data
        </button>
      </div>
      <div style={styles.cardBody}>
        <div
          style={{
            marginBottom: "20px",
            paddingBottom: "20px",
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <input
            type="text"
            placeholder="🔍 Search..."
            value={globalSearch}
            onChange={(e) => {
              setGlobalSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              ...styles.input(false),
              width: "100%",
              padding: "8px 12px",
            }}
          />
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {[
                    "NGO Name",
                    "Reg Date",
                    "Reg No",
                    "PAN No",
                    "Darpan ID",
                    "NGO Email",
                    "NGO Mobile",
                    "State",
                    "District",
                    "Block",
                    "Reg Addr",
                    "Work Addr",
                    "Sec Name",
                    "Sec Email",
                    "Sec Mobile",
                    "Sec Aadhar",
                    "Acc Holder",
                    "Bank Name",
                    "Acc No",
                    "IFSC",
                    "Bank Addr",
                    "Reg Cert",
                    "PAN Doc",
                    "Darpan Doc",
                    "Status",
                    "Appr By",
                    "Appr Date",
                    "Appr ID",
                    "Username",
                    "Password",
                    "Login Email",
                    "Actions",
                  ].map((h) => (
                    <th style={styles.th} key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentTableData.map((row) => (
                  <tr key={row.DistNGORegId}>
                    <td style={styles.td}>{row.DistNGOName}</td>
                    <td style={styles.td}>
                      {formatDisplayDate(row.DistNGORegDate)}
                    </td>
                    <td style={styles.td}>{row.DistNGORegNo}</td>
                    <td style={styles.td}>{row.DistNGOPanNo}</td>
                    <td style={styles.td}>{row.DistNGODarpanId}</td>
                    <td style={styles.td}>{row.DistNGOMailId}</td>
                    <td style={styles.td}>{row.DistNGOPhoneNo}</td>
                    <td style={styles.td}>{row.DistNGOStateName}</td>
                    <td style={styles.td}>{row.DistNGODistName}</td>
                    <td style={styles.td}>{row.DistNGOBlockName}</td>
                    <td style={styles.td}>{row.DistNGORegAddress}</td>
                    <td style={styles.td}>{row.DistNGOWorkingAddress}</td>
                    <td style={styles.td}>{row.DistNGOSDPName}</td>
                    <td style={styles.td}>{row.DistNGOSDPMailId}</td>
                    <td style={styles.td}>{row.DistNGOSDPPhoneNo}</td>
                    {/* Dynamic DB Mapping added here to unhide the info */}
                    <td style={styles.td}>{row.DistNGOSDPAadhaarNo}</td>
                    <td style={styles.td}>{row.DistNGOBankAcctHolderName}</td>
                    <td style={styles.td}>{row.DistNGOBankName}</td>
                    <td style={styles.td}>{row.DistNGOAcctNo}</td>
                    <td style={styles.td}>{row.DistNGOIFSCode}</td>
                    <td style={styles.td}>{row.DistNGOBankAdd}</td>
                    <td style={styles.td}>
                      {row.DistNGORecCertificate ? "✅" : "❌"}
                    </td>
                    <td style={styles.td}>{row.DistNGOPanPic ? "✅" : "❌"}</td>
                    <td style={styles.td}>
                      {row.DistNGODarpanPic ? "✅" : "❌"}
                    </td>
                    <td
                      style={{
                        ...styles.td,
                        color:
                          Number(row.DistNGOIsActive) === 2
                            ? "green"
                            : "orange",
                      }}
                    >
                      {Number(row.DistNGOIsActive) === 2
                        ? "Approved"
                        : "Pending"}
                    </td>
                    <td style={styles.td}>
                      {row.ApproverDisplayName || row.DistNGOAprovedBy || "-"}
                    </td>
                    <td style={styles.td}>
                      {formatDisplayDate(row.DistNGOAprovedDate)}
                    </td>
                    <td style={styles.td}>{row.DistNGOGenRegNo || "-"}</td>
                    <td style={styles.td}>{row.DistNGOSignupUserName}</td>
                    <td style={styles.td}>{row.DistNGOSignupPassword}</td>
                    <td style={styles.td}>{row.DistNGOSignupEmail}</td>
                    <td style={styles.td}>
                      <button
                        onClick={() => openModal("view", row)}
                        style={styles.actionBtn}
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => openModal("edit", row)}
                        style={styles.actionBtn}
                      >
                        ✏️
                      </button>
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
                      {Number(row.DistNGOIsActive) !== 2 &&
                        ["national ngo", "state super administrator"].includes(
                          (userRole || "").toLowerCase(),
                        ) && (
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
                {filteredMembers.length === 0 && (
                  <tr>
                    <td
                      colSpan="32"
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      {externalFilters?.filterMotherNgo &&
                      externalFilters?.filterState &&
                      externalFilters?.filterDistrict
                        ? "No members found."
                        : "Please select District NGO, State, and District to view records."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredMembers.length > 0 && (
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <label>Rows: </label>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                style={styles.btnOutline}
              >
                Prev
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                style={styles.btnOutline}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {viewModal && selectedRow && (
        <DistrictAdminModal
          member={selectedRow}
          mode="view"
          onClose={closeModal}
          onSuccess={closeModal}
        />
      )}
      {editModal && selectedRow && (
        <DistrictAdminModal
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
            <h4>Confirm Delete</h4>
            <button onClick={closeModal} style={styles.btnOutline}>
              Cancel
            </button>
            <button onClick={confirmDelete} style={styles.btnDanger}>
              Yes
            </button>
          </div>
        </div>
      )}
      {/* Enhanced Approval Modal UI */}
      {approveModal && selectedRow && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: "500px" }}>
            <h4
              style={{
                marginBottom: "16px",
                borderBottom: "1px solid #eee",
                paddingBottom: "10px",
              }}
            >
              Approve District Admin
            </h4>
            <div
              style={{
                marginBottom: "20px",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              <p style={{ margin: "6px 0" }}>
                <strong>Approving Authority:</strong> {userRole} (ID: {userId})
              </p>
              <p style={{ margin: "6px 0" }}>
                <strong>Approving NGO:</strong> {selectedRow.DistNGOName}
              </p>
              <p style={{ margin: "6px 0" }}>
                <strong>State:</strong> {selectedRow.DistNGOStateName || "N/A"}{" "}
                | <strong>District:</strong>{" "}
                {selectedRow.DistNGODistName || "N/A"}
              </p>
              <p style={{ margin: "6px 0" }}>
                <strong>Secretary Aadhaar:</strong>{" "}
                {selectedRow.DistNGOSDPAadhaarNo || "N/A"}
              </p>

              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "6px",
                  border: "1px dashed #ccc",
                }}
              >
                <p style={{ margin: 0, fontWeight: "bold" }}>
                  Generated Approval ID:
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "#007bff",
                    fontWeight: "bold",
                    fontSize: "16px",
                  }}
                >
                  {approvalData.id}
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button onClick={closeModal} style={styles.btnOutline}>
                Cancel
              </button>
              <button onClick={confirmApprove} style={styles.btnSuccess}>
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistrictAdminTable;

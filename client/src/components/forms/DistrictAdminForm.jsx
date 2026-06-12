import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Select from "react-select";
import { toast } from "react-toastify";
import {
  API_BASE_URL,
  indianPhoneRegex,
  styles,
  FormInput,
  fileToBase64,
} from "../../config/constants";
import { getSafeUser, handleViewPdf } from "../AccountSharedUtils";
import { validateUniqueFields } from "../AccountSharedUtils";

export const ngoSchema = z.object({
  ngoName: z.string().trim().min(2, "NGO Name is required"),
  ngoRegistrationDate: z.string().min(1, "Date is required"),
  ngoRegistrationNo: z.string().trim().min(1, "Registration No is required"),
  ngoPanNo: z.string().trim().min(1, "PAN No is required"),
  ngoDarpanId: z.string().trim().min(1, "NGO Darpan ID is required"),
  generalNgoEmail: z.string().trim().email("Valid email required"),
  ngoMobile: z
    .string()
    .trim()
    .regex(indianPhoneRegex, "Valid Indian phone required"),
  ngoRegAddress: z.string().trim().min(5, "Address is required"),
  ngoWorkingAddress: z.string().trim().min(5, "Address is required"),
  state: z
    .object({ value: z.any(), label: z.string() })
    .nullable()
    .refine((value) => !!value, { message: "State is required" }),
  district: z
    .object({ value: z.any(), label: z.string() })
    .nullable()
    .refine((value) => !!value, { message: "District is required" }),
  blockName: z.string().trim().min(1, "Block Name is required"),
  sdpName: z.string().trim().min(2, "Name is required"),
  secretaryEmail: z.string().trim().email("Valid email required"),
  secretaryMobile: z
    .string()
    .trim()
    .regex(indianPhoneRegex, "Valid phone required"),
  secretaryAadhar: z
    .string()
    .trim()
    .min(1, "Aadhaar is required")
    .length(12, "Must be exactly 12 digits")
    .regex(/^\d+$/, "Numbers only"),

  bankAccountHolderName: z
    .string()
    .trim()
    .min(1, "Account Holder Name is required"),
  bankName: z.string().trim().min(1, "Bank Name is required"),
  accountNo: z.string().trim().min(1, "Account Number is required"),
  ifsCode: z.string().trim().min(1, "IFS Code is required"),
  bankAddress: z.string().trim().min(1, "Bank Address is required"),

  userName: z.string().trim().min(1, "User Name is required"),
  ngoEmail: z.string().trim().email("Valid login email required"),
  password: z.string().refine((value) => value.trim().length > 0, {
    message: "Password is required",
  }),
});

const PasswordInput = ({
  label,
  id,
  error,
  placeholder,
  disabled,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div style={styles.inputGroup}>
      <label htmlFor={id} style={styles.label}>
        {label}
      </label>
      <div
        style={{ position: "relative", display: "flex", alignItems: "center" }}
      >
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          style={
            disabled
              ? styles.inputDisabled
              : { ...styles.input(!!error), paddingRight: "40px" }
          }
          placeholder={placeholder}
          disabled={disabled}
          {...props}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          style={{
            position: "absolute",
            right: "10px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#697a8d",
            fontSize: "1.2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        >
          {showPassword ? "👁️‍🗨️" : "👁️"}
        </button>
      </div>
      {error && <p style={styles.errorText}>{error.message}</p>}
    </div>
  );
};

const DistrictAdminForm = ({
  onSuccess,
  filterStateNgo,
  defaultState,
  defaultDistrict,
}) => {
  const [dbStates, setDbStates] = useState([]);
  const [dbDistricts, setDbDistricts] = useState([]);

  const [regCertPdf, setRegCertPdf] = useState(null);
  const [panPdf, setPanPdf] = useState(null);
  const [darpanPdf, setDarpanPdf] = useState(null);
  const [documentInputKey, setDocumentInputKey] = useState(0);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ngoSchema),
    mode: "onChange",
    defaultValues: {
      ngoName: "",
      ngoRegistrationDate: "",
      ngoRegistrationNo: "",
      ngoPanNo: "",
      ngoDarpanId: "",
      generalNgoEmail: "",
      ngoMobile: "",
      ngoRegAddress: "",
      ngoWorkingAddress: "",
      state: null,
      district: null,
      blockName: "",
      sdpName: "",
      secretaryEmail: "",
      secretaryMobile: "",
      secretaryAadhar: "",
      bankAccountHolderName: "",
      bankName: "",
      accountNo: "",
      ifsCode: "",
      bankAddress: "",
      userName: "",
      ngoEmail: "",
      password: "",
    },
  });

  const selectedState = watch("state");
  const ngoNameValue = watch("ngoName");

  // Pre-fill Logic
  useEffect(() => {
    if (defaultState) setValue("state", defaultState, { shouldValidate: true });
    if (defaultDistrict)
      setValue("district", defaultDistrict, { shouldValidate: true });
  }, [defaultState, defaultDistrict, setValue]);

  useEffect(() => {
    setValue("userName", ngoNameValue || "", { shouldValidate: true });
  }, [ngoNameValue, setValue]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/states`)
      .then((res) => res.json())
      .then((data) =>
        setDbStates(
          data.map((s) => ({ value: s.StateId, label: s.StateName })),
        ),
      );
  }, []);

  useEffect(() => {
    if (selectedState && selectedState.value) {
      fetch(`${API_BASE_URL}/districts/${selectedState.value}`)
        .then((res) => res.json())
        .then((data) =>
          setDbDistricts(
            data.map((d) => ({ value: d.DistId, label: d.DistName })),
          ),
        );
    } else {
      setDbDistricts([]);
    }
  }, [selectedState]);

  const handlePdfUpload = async (event, setPdfState) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== "application/pdf")
        return toast.warning("Only PDF files are allowed.");
      if (file.size > 5000000)
        return toast.warning("File size exceeds the 5MB limit.");
      try {
        const b64 = await fileToBase64(file);
        setPdfState(b64);
      } catch (err) {
        toast.error("Error reading the file.");
      }
    }
  };

  const handleCancel = () => {
    reset();
    setRegCertPdf(null);
    setPanPdf(null);
    setDarpanPdf(null);
    setDocumentInputKey((prev) => prev + 1);
  };

  const onSubmitDistrictAdmin = async (data) => {
    // Made Darpan PDF optional here
    if (!regCertPdf || !panPdf) {
      toast.error(
        "Required: Please upload the mandatory documents (Reg Cert and PAN) before submitting.",
        { position: "top-right" },
      );
      return;
    }
    const checks = [
      {
        table: "dist_ngo_reg",
        column: "DistNGOMailId",
        value: data.generalNgoEmail,
        label: "Email ID",
      },
      {
        table: "dist_ngo_reg",
        column: "DistNGOSignupUserName",
        value: data.userName,
        label: "Username",
      },
    ];
    if (!(await validateUniqueFields(checks))) return;

    const loggedInUser = getSafeUser ? getSafeUser() : null;
    const loggedInRole = (
      loggedInUser?.role ||
      loggedInUser?.UserSignUpRole ||
      ""
    ).toLowerCase();
    const currentUserId = loggedInUser
      ? loggedInUser.UserSignUpId || loggedInUser.id
      : null;
    const stateNgoRegId =
      filterStateNgo?.value ||
      (loggedInRole === "state super administrator"
        ? loggedInUser?.ProfileRegId
        : null);

    if (
      ["national ngo", "state super administrator"].includes(loggedInRole) &&
      !stateNgoRegId
    ) {
      toast.error("Please select a State Super Administrator first.");
      return;
    }

    const dbPayload = {
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
      DistNGORecCertificate: regCertPdf,
      DistNGOPanPic: panPdf,
      DistNGODarpanPic: darpanPdf,
      DistNGOSignupUserName: data.userName,
      DistNGOSignupEmail: data.ngoEmail,
      DistNGOSignupPassword: data.password,
      DistNGOCreatedByAuthRegId: currentUserId,
      DistNGOIsActive: 1,
      StateNGORegId: stateNgoRegId,
      DistNGOAprovedBy: null,
      DistNGOAprovedDate: null,
      DistNGOGenRegNo: null,
      AcctHead: "DN",
    };

    try {
      toast.loading("Saving District Admin data...", {
        toastId: "savingAdmin",
      });
      const response = await fetch(`${API_BASE_URL}/districtadmin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPayload),
      });
      toast.dismiss("savingAdmin");
      if (response.ok) {
        toast.success("Success: Data saved to Database!", {
          position: "top-right",
        });
        handleCancel();
        if (onSuccess) onSuccess();
      } else {
        toast.error("Failed to save data. Check backend logs.", {
          position: "top-right",
        });
      }
    } catch (error) {
      toast.dismiss("savingAdmin");
      toast.error("Network error. Could not reach server.", {
        position: "top-right",
      });
    }
  };

  const onError = () =>
    toast.error("Form Error: Please check the highlighted fields.", {
      position: "top-right",
    });

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h5>District Administrator Registration</h5>
      </div>
      <div style={styles.cardBody}>
        <form
          onSubmit={handleSubmit(onSubmitDistrictAdmin, onError)}
          autoComplete="off"
        >
          <h6 style={styles.sectionHeader}>NGO Details</h6>
          <div style={styles.formGrid}>
            <Controller
              name="ngoName"
              control={control}
              render={({ field }) => (
                <FormInput
                  label={
                    <>
                      NGO Full Name <span style={{ color: "#ff3e1d" }}>*</span>
                    </>
                  }
                  id="ngoName"
                  error={errors.ngoName}
                  type="text"
                  {...field}
                />
              )}
            />
            <Controller
              name="ngoRegistrationDate"
              control={control}
              render={({ field }) => (
                <FormInput
                  label={
                    <>
                      Date of NGO/ Trustee Registration{" "}
                      <span style={{ color: "#ff3e1d" }}>*</span>
                    </>
                  }
                  id="ngoRegistrationDate"
                  error={errors.ngoRegistrationDate}
                  type="date"
                  {...field}
                />
              )}
            />
            <Controller
              name="ngoRegistrationNo"
              control={control}
              render={({ field }) => (
                <FormInput
                  label={
                    <>
                      NGO Registration No/ CIN / Trustee Deed No{" "}
                      <span style={{ color: "#ff3e1d" }}>*</span>
                    </>
                  }
                  id="ngoRegistrationNo"
                  error={errors.ngoRegistrationNo}
                  type="text"
                  {...field}
                />
              )}
            />
            <Controller
              name="ngoPanNo"
              control={control}
              render={({ field }) => (
                <FormInput
                  label={
                    <>
                      NGO PAN No <span style={{ color: "#ff3e1d" }}>*</span>
                    </>
                  }
                  id="ngoPanNo"
                  error={errors.ngoPanNo}
                  type="text"
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
                  id="ngoDarpanId"
                  error={errors.ngoDarpanId}
                  type="text"
                  {...field}
                />
              )}
            />
            <Controller
              name="generalNgoEmail"
              control={control}
              render={({ field }) => (
                <FormInput
                  label="NGO General Email ID"
                  id="generalNgoEmail"
                  error={errors.generalNgoEmail}
                  type="email"
                  placeholder="General contact email"
                  {...field}
                />
              )}
            />
            <Controller
              name="ngoMobile"
              control={control}
              render={({ field }) => (
                <FormInput
                  label={
                    <>
                      NGO Mobile No <span style={{ color: "#ff3e1d" }}>*</span>
                    </>
                  }
                  id="ngoMobile"
                  error={errors.ngoMobile}
                  type="tel"
                  {...field}
                />
              )}
            />
          </div>

          <h6 style={styles.sectionHeader}>Address Details</h6>
          <div style={styles.formGrid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Willing to work State Name{" "}
                <span style={{ color: "#ff3e1d" }}>*</span>
              </label>
              <Controller
                name="state"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={dbStates}
                    styles={styles.selectStyles(!!errors.state)}
                    placeholder="Select State"
                    isDisabled={!!defaultState}
                  />
                )}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Willing to work which district Name{" "}
                <span style={{ color: "#ff3e1d" }}>*</span>
              </label>
              <Controller
                name="district"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={dbDistricts}
                    styles={styles.selectStyles(!!errors.district)}
                    placeholder="Select District"
                    isDisabled={!selectedState || !!defaultDistrict}
                  />
                )}
              />
            </div>
            <Controller
              name="blockName"
              control={control}
              render={({ field }) => (
                <FormInput
                  label={
                    <>
                      Willing to work which Block Name{" "}
                      <span style={{ color: "#ff3e1d" }}>
                        * (Can type multiple)
                      </span>
                    </>
                  }
                  id="blockName"
                  error={errors.blockName}
                  type="text"
                  {...field}
                />
              )}
            />
            <Controller
              name="ngoRegAddress"
              control={control}
              render={({ field }) => (
                <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                  <label htmlFor="ngoRegAddress" style={styles.label}>
                    NGO Register Address{" "}
                    <span style={{ color: "#ff3e1d" }}>*</span>
                  </label>
                  <textarea
                    id="ngoRegAddress"
                    style={{
                      ...styles.input(!!errors.ngoRegAddress),
                      resize: "vertical",
                      minHeight: "80px",
                      backgroundColor: "#fff",
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
                  <label htmlFor="ngoWorkingAddress" style={styles.label}>
                    NGO Working office full address{" "}
                    <span style={{ color: "#ff3e1d" }}>*</span>
                  </label>
                  <textarea
                    id="ngoWorkingAddress"
                    style={{
                      ...styles.input(!!errors.ngoWorkingAddress),
                      resize: "vertical",
                      minHeight: "80px",
                      backgroundColor: "#fff",
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
                  label={
                    <>
                      Secretary/ Director/ President Full Name{" "}
                      <span style={{ color: "#ff3e1d" }}>*</span>
                    </>
                  }
                  id="sdpName"
                  error={errors.sdpName}
                  type="text"
                  {...field}
                />
              )}
            />
            <Controller
              name="secretaryEmail"
              control={control}
              render={({ field }) => (
                <FormInput
                  label={
                    <>
                      Secretary/ Director/ President Email ID{" "}
                      <span style={{ color: "#ff3e1d" }}>*</span>
                    </>
                  }
                  id="secretaryEmail"
                  error={errors.secretaryEmail}
                  type="email"
                  {...field}
                />
              )}
            />
            <Controller
              name="secretaryMobile"
              control={control}
              render={({ field }) => (
                <FormInput
                  label={
                    <>
                      Secretary/ Director/ President Mobile No{" "}
                      <span style={{ color: "#ff3e1d" }}>*</span>
                    </>
                  }
                  id="secretaryMobile"
                  error={errors.secretaryMobile}
                  type="tel"
                  {...field}
                />
              )}
            />
            <Controller
              name="secretaryAadhar"
              control={control}
              render={({ field }) => (
                <FormInput
                  label={
                    <>
                      Secretary/ Director Aadhaar Card Number{" "}
                      <span style={{ color: "#ff3e1d" }}>*</span>
                    </>
                  }
                  id="secretaryAadhar"
                  error={errors.secretaryAadhar}
                  type="text"
                  maxLength={12}
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
                  id="userName"
                  error={errors.userName}
                  type="text"
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
                  label={
                    <>
                      Email ID (For Login){" "}
                      <span style={{ color: "#ff3e1d" }}>*</span>
                    </>
                  }
                  id="ngoEmail"
                  error={errors.ngoEmail}
                  type="email"
                  autoComplete="off"
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
                      <span style={{ color: "#ff3e1d" }}>
                        * (Don't forget it!)
                      </span>
                    </>
                  }
                  id="password"
                  error={errors.password}
                  autoComplete="new-password"
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
                  id="bankAccountHolderName"
                  error={errors.bankAccountHolderName}
                  type="text"
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
                  id="bankName"
                  error={errors.bankName}
                  type="text"
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
                  id="accountNo"
                  error={errors.accountNo}
                  type="text"
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
                  id="ifsCode"
                  error={errors.ifsCode}
                  type="text"
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
                  id="bankAddress"
                  error={errors.bankAddress}
                  type="text"
                  {...field}
                />
              )}
            />
          </div>

          <h6 style={styles.sectionHeader}>Documents</h6>
          <div style={styles.formGrid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Reg Cert PDF <span style={{ color: "#ff3e1d" }}>*</span>
              </label>
              <input
                key={`reg-cert-${documentInputKey}`}
                type="file"
                accept="application/pdf"
                onChange={(e) => handlePdfUpload(e, setRegCertPdf)}
                style={styles.input(false)}
              />
              {regCertPdf && (
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
                    👁️ Preview PDF
                  </button>
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
                </div>
              )}
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                NGO PAN PDF <span style={{ color: "#ff3e1d" }}>*</span>
              </label>
              <input
                key={`pan-${documentInputKey}`}
                type="file"
                accept="application/pdf"
                onChange={(e) => handlePdfUpload(e, setPanPdf)}
                style={styles.input(false)}
              />
              {panPdf && (
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
                    👁️ Preview PDF
                  </button>
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
                </div>
              )}
            </div>
            <div style={styles.inputGroup}>
              {/* Removed the * required indicator from Darpan PDF */}
              <label style={styles.label}>Darpan PDF</label>
              <input
                key={`darpan-${documentInputKey}`}
                type="file"
                accept="application/pdf"
                onChange={(e) => handlePdfUpload(e, setDarpanPdf)}
                style={styles.input(false)}
              />
              {darpanPdf && (
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
                    👁️ Preview PDF
                  </button>
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
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "16px",
              marginTop: "32px",
            }}
          >
            <button
              type="button"
              style={styles.btnOutline}
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button type="submit" style={styles.btnPrimary}>
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DistrictAdminForm;

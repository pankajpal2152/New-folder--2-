import React, { useState, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Select from "react-select";
import { toast } from "react-toastify";
import {
  API_BASE_URL,
  DUMMY_AVATAR,
  indianZipRegex,
  indianPhoneRegex,
  styles,
  FormInput,
} from "../../config/constants";
import { validateUniqueFields } from "../AccountSharedUtils";

export const accountSchema = z.object({
  joiningAmount: z.string().min(1, "Joining Amount is required"),
  walletBalance: z.string().min(1, "Wallet Balance is required"),
  fullName: z
    .string()
    .trim()
    .min(2, "Min 2 characters")
    .max(50, "Max 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Letters only"),
  sdwOf: z.string().trim().min(1, "S/D/W of is required"),
  dob: z.string().min(1, "Date of Birth is required"),
  guardianContactNo: z
    .string()
    .trim()
    .min(1, "Guardian Contact no is required"),
  state: z
    .object({ value: z.any(), label: z.string() })
    .nullable()
    .refine((value) => !!value, { message: "State is required" }),
  district: z
    .object({ value: z.any(), label: z.string() })
    .nullable()
    .refine((value) => !!value, { message: "District is required" }),
  city: z.string().trim().min(1, "City is required"),
  block: z.string().min(1, "Block is required"),
  postOffice: z.string().trim().min(1, "Post Office is required"),
  policeStation: z.string().trim().min(1, "Police Station is required"),
  gramPanchayet: z.string().min(1, "Gram Panchayet is required"),
  village: z.string().min(1, "Village is required"),
  pinCode: z
    .string()
    .regex(indianZipRegex, "Valid 6-digit Pincode required")
    .length(6, "Must be exactly 6 digits"),
  mobileNo: z.string().regex(indianPhoneRegex, "Valid Indian phone required"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .max(100, "Max 100 characters"),
  userName: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  bankName: z.string().trim().min(1, "Bank Name is required"),
  branchName: z.string().trim().min(1, "Branch Name is required"),
  accountNo: z.string().trim().min(1, "Account No is required"),
  ifsCode: z.string().trim().min(1, "IFS Code is required"),
  panNo: z.string().trim().min(1, "PAN No is required"),
  aadharNo: z
    .string()
    .trim()
    .min(1, "Aadhar No is required")
    .length(12, "Aadhaar must be 12 digits")
    .regex(/^\d+$/, "Numbers only"),
  deactivateConfirm: z.boolean().optional(),
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
          title={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? "👁️‍🗨️" : "👁️"}
        </button>
      </div>
      {error && <p style={styles.errorText}>{error.message}</p>}
    </div>
  );
};

const AsthaDidiForm = ({ onSuccess, externalFilters }) => {
  const {
    filterStateNgo,
    filterMotherNgo,
    filterState,
    filterDistrict,
    filterSupervisor,
  } = externalFilters || {};

  const [dbStates, setDbStates] = useState([]);
  const [dbDistricts, setDbDistricts] = useState([]);
  const [profileImage, setProfileImage] = useState(DUMMY_AVATAR);
  const fileInputRef = useRef(null);

  // ✅ FIXED: Using inclusive hierarchy validation
  const [isFormAllowed, setIsFormAllowed] = useState(false);
  const [isStrictSupervisor, setIsStrictSupervisor] = useState(false);
  const [loggedRole, setLoggedRole] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(accountSchema),
    mode: "onChange",
    defaultValues: {
      joiningAmount: "5000",
      walletBalance: "27000",
      fullName: "",
      sdwOf: "",
      dob: "",
      guardianContactNo: "",
      state: null,
      district: null,
      city: "",
      block: "",
      postOffice: "",
      policeStation: "",
      gramPanchayet: "",
      village: "",
      pinCode: "",
      mobileNo: "",
      email: "",
      userName: "",
      password: "",
      bankName: "",
      branchName: "",
      accountNo: "",
      ifsCode: "",
      panNo: "",
      aadharNo: "",
      deactivateConfirm: false,
    },
  });

  const selectedState = watch("state");
  const fullNameValue = watch("fullName");

  useEffect(() => {
    const userStr = localStorage.getItem("loggedInUser");
    if (userStr) {
      try {
        const loggedInUser = JSON.parse(userStr);
        const role = (loggedInUser?.role || "").toLowerCase();
        const signUpRole = (loggedInUser?.UserSignUpRole || "").toLowerCase();
        const resolvedRole = role || signUpRole;
        setLoggedRole(resolvedRole);

        setIsStrictSupervisor(
          role === "supervisor" || signUpRole === "supervisor",
        );

        // ✅ FIXED: Form is allowed for State Super Admin, Developer, District Admin, and Supervisor
        setIsFormAllowed(
          role === "national ngo" ||
            signUpRole === "national ngo" ||
            role === "supervisor" ||
            signUpRole === "supervisor" ||
            role === "district administrator" ||
            signUpRole === "district administrator" ||
            role === "state super administrator" ||
            signUpRole === "state super administrator" ||
            role === "developer" ||
            signUpRole === "developer",
        );
      } catch (e) {
        console.error("Error parsing loggedInUser from localStorage", e);
      }
    }
  }, []);

  useEffect(() => {
    if (fullNameValue !== undefined) {
      setValue("userName", fullNameValue, { shouldValidate: true });
    }
  }, [fullNameValue, setValue]);

  useEffect(() => {
    if (filterState) {
      setDbStates([filterState]);
      setValue("state", filterState, { shouldValidate: true });
    } else {
      fetch(`${API_BASE_URL}/states`)
        .then((res) => res.json())
        .then((data) =>
          setDbStates(
            data.map((s) => ({ value: s.StateId, label: s.StateName })),
          ),
        );
    }
  }, [filterState, setValue]);

  useEffect(() => {
    if (filterDistrict) {
      setDbDistricts([filterDistrict]);
      setValue("district", filterDistrict, { shouldValidate: true });
    } else if (selectedState && selectedState.value && !filterState) {
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
  }, [filterDistrict, selectedState, filterState, setValue]);

  const handleUploadClick = () => fileInputRef.current.click();
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 800000) return toast.warning("Image size exceeds 800K.");
      const reader = new FileReader();
      reader.onloadend = () => setProfileImage(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const handleResetImage = () => {
    setProfileImage(DUMMY_AVATAR);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCancelAsthaDidi = () => {
    reset();
    handleResetImage();
  };

  const onSubmitAsthaDidi = async (data) => {
    if (!isFormAllowed) {
      toast.error(
        "Access Denied: You do not have permission to submit this form.",
        {
          position: "top-right",
        },
      );
      return;
    }

    const checks = [
      {
        table: "asthadidi_reg",
        column: "AsthaDidiMailId",
        value: data.email,
        label: "Email",
        idColumn: null,
        idValue: null,
      },
      {
        table: "asthadidi_reg",
        column: "AsthaDidiSignupUserName",
        value: data.userName,
        label: "Username",
        idColumn: null,
        idValue: null,
      },
    ];
    if (data.aadharNo) {
      checks.push({
        table: "asthadidi_reg",
        column: "AsthaDidiAadharNo",
        value: data.aadharNo,
        label: "Aadhar No",
        idColumn: null,
        idValue: null,
      });
    }

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

    let currentUserId = null;
    let currentUserProfileId = null;
    const userStr = localStorage.getItem("loggedInUser");
    if (userStr) {
      try {
        const loggedInUser = JSON.parse(userStr);
        currentUserId = loggedInUser?.UserSignUpId || loggedInUser?.id || null;
        currentUserProfileId = loggedInUser?.ProfileRegId || null;
      } catch (e) {
        console.error("Error parsing loggedInUser", e);
      }
    }

    const dbPayload = {
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
      AsthaDidiBankName: data.bankName || "",
      AsthaDidiBranchName: data.branchName || "",
      AsthaDidiBankAcctNo: data.accountNo || "0",
      AsthaDidiIFSCode: data.ifsCode || "",
      AsthaDidiPanNo: data.panNo || "",
      AsthaDidiAadharNo: data.aadharNo || null,
      AsthaDidiJoiningAmt: parseInt(data.joiningAmount) || 5000,
      AsthaDidiWalletBalance: parseInt(data.walletBalance) || 0,
      AsthaDidiSignupUserName: data.userName,
      AsthaDidiSignupEmail: data.email,
      AsthaDidiSignupPassword: data.password,
      AsthaDidiCreatedByAuthRegId: currentUserId,
      StateNGORegId:
        filterStateNgo?.value ||
        filterSupervisor?.stateNgoRegId ||
        filterMotherNgo?.stateNgoRegId ||
        null,
      DistNGORegId: filterMotherNgo ? filterMotherNgo.value : null,
      SupRegId:
        isStrictSupervisor && currentUserProfileId
          ? currentUserProfileId
          : filterSupervisor
            ? filterSupervisor.value
            : null,
      AsthaDidiIsActive: 1,
      AcctHead: "AD",
    };

    if (dbPayload.AsthaDidiDOB)
      dbPayload.AsthaDidiDOB = String(dbPayload.AsthaDidiDOB).substring(0, 10);

    try {
      toast.loading("Saving to local database...", { toastId: "saving" });
      const response = await fetch(`${API_BASE_URL}/asthadidi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPayload),
      });
      toast.dismiss("saving");

      if (response.ok) {
        toast.success("Success: Data saved to Database!", {
          position: "top-right",
        });
        handleCancelAsthaDidi();
        onSuccess();
      } else {
        toast.error("Failed to save data. Check backend logs.", {
          position: "top-right",
        });
      }
    } catch (error) {
      toast.dismiss("saving");
      toast.error("Network error. Could not reach server.", {
        position: "top-right",
      });
    }
  };

  const onErrorAsthaDidi = () =>
    toast.error("Error: Please check the red fields.", {
      position: "top-right",
    });

  // ✅ FIXED: Evaluates true for Super Admin as long as they pick a Supervisor from the external filter
  const isFormEnabled =
    isFormAllowed &&
    (isStrictSupervisor
      ? true
      : !!filterMotherNgo &&
        !!filterState &&
        !!filterDistrict &&
        !!filterSupervisor &&
        (loggedRole !== "national ngo" || !!filterStateNgo));

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h5>Astha Didi Registration</h5>
      </div>

      {!isFormAllowed && (
        <div
          style={{
            padding: "12px 24px",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            borderBottom: "1px solid #f5c6cb",
          }}
        >
          <strong>Access Denied:</strong> Only a user with the correct
          Administrative role can submit this form. Your current role does not
          permit this action.
        </div>
      )}

      {isFormAllowed && !isStrictSupervisor && !filterSupervisor && (
        <div
          style={{
            padding: "12px 24px",
            backgroundColor: "#fff3cd",
            color: "#856404",
            borderBottom: "1px solid #ffeeba",
          }}
        >
          <strong>Notice:</strong> Please select a <strong>SUPERVISOR</strong>{" "}
          from the top filters before filling out this registration form.
        </div>
      )}

      <div
        style={{
          ...styles.cardBody,
          opacity: !isFormEnabled ? 0.6 : 1,
          pointerEvents: !isFormEnabled ? "none" : "auto",
        }}
      >
        <div style={styles.profileSection}>
          <img src={profileImage} alt="Profile Avatar" style={styles.avatar} />
          <div>
            <div style={styles.buttonGroup}>
              <button
                type="button"
                style={styles.btnOutline}
                onClick={handleUploadClick}
              >
                Upload new photo
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
            <p style={styles.hintText}>
              Allowed JPG, GIF or PNG. Max size of 800K
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmitAsthaDidi, onErrorAsthaDidi)}
          autoComplete="off"
        >
          <h6 style={styles.sectionHeader}>Astha Didi Information</h6>
          <div style={styles.formGrid}>
            <Controller
              name="joiningAmount"
              control={control}
              render={({ field }) => (
                <FormInput
                  label={
                    <>
                      Joining Amount <span style={{ color: "#ff3e1d" }}>*</span>
                    </>
                  }
                  id="joiningAmount"
                  error={errors.joiningAmount}
                  placeholder="Enter Amount"
                  type="number"
                  readOnly
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
                  label={
                    <>
                      Wallet Balance <span style={{ color: "#ff3e1d" }}>*</span>
                    </>
                  }
                  id="walletBalance"
                  error={errors.walletBalance}
                  disabled={true}
                  readOnly
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
                  label={
                    <>
                      Full Name <span style={{ color: "#ff3e1d" }}>*</span>
                    </>
                  }
                  id="fullName"
                  error={errors.fullName}
                  placeholder="Applicant Name"
                  type="text"
                  maxLength={50}
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
                  id="sdwOf"
                  error={errors.sdwOf}
                  placeholder="S/D/W of"
                  type="text"
                  maxLength={50}
                  {...field}
                />
              )}
            />
            <Controller
              name="dob"
              control={control}
              render={({ field }) => (
                <FormInput
                  label={
                    <>
                      Date of Birth <span style={{ color: "#ff3e1d" }}>*</span>
                    </>
                  }
                  id="dob"
                  error={errors.dob}
                  placeholder="DD/MM/YYYY"
                  type="date"
                  {...field}
                />
              )}
            />
            <Controller
              name="guardianContactNo"
              control={control}
              render={({ field }) => (
                <FormInput
                  label={
                    <>
                      Guardian Contact no{" "}
                      <span style={{ color: "#ff3e1d" }}>*</span>
                    </>
                  }
                  id="guardianContactNo"
                  error={errors.guardianContactNo}
                  placeholder="Guardian Contact no"
                  type="text"
                  maxLength={50}
                  {...field}
                />
              )}
            />
          </div>

          <h6 style={styles.sectionHeader}>Postal Address Information</h6>
          <div style={styles.formGrid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Select State</label>
              <Controller
                name="state"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={dbStates}
                    styles={styles.selectStyles(!!errors.state)}
                    placeholder="Select State"
                    isDisabled={!!filterState}
                  />
                )}
              />
              {errors.state && (
                <p style={styles.errorText}>{errors.state.message}</p>
              )}
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>District</label>
              <Controller
                name="district"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={dbDistricts}
                    styles={styles.selectStyles(!!errors.district)}
                    placeholder="Select District"
                    isDisabled={!!filterDistrict || !selectedState}
                  />
                )}
              />
              {errors.district && (
                <p style={styles.errorText}>{errors.district.message}</p>
              )}
            </div>
            <Controller
              name="city"
              control={control}
              render={({ field }) => (
                <FormInput
                  label="City"
                  id="city"
                  error={errors.city}
                  placeholder="City"
                  type="text"
                  maxLength={50}
                  {...field}
                />
              )}
            />
            <Controller
              name="block"
              control={control}
              render={({ field }) => (
                <FormInput
                  label={
                    <>
                      Block <span style={{ color: "#ff3e1d" }}>*</span>
                    </>
                  }
                  id="block"
                  error={errors.block}
                  placeholder="Block"
                  type="text"
                  maxLength={50}
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
                  id="postOffice"
                  error={errors.postOffice}
                  placeholder="Post Office"
                  type="text"
                  maxLength={50}
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
                  id="policeStation"
                  error={errors.policeStation}
                  placeholder="Police Station"
                  type="text"
                  maxLength={50}
                  {...field}
                />
              )}
            />
            <Controller
              name="gramPanchayet"
              control={control}
              render={({ field }) => (
                <FormInput
                  label={
                    <>
                      Gram Panchayet <span style={{ color: "#ff3e1d" }}>*</span>
                    </>
                  }
                  id="gramPanchayet"
                  error={errors.gramPanchayet}
                  placeholder="Gram Panchayet"
                  type="text"
                  maxLength={50}
                  {...field}
                />
              )}
            />
            <Controller
              name="village"
              control={control}
              render={({ field }) => (
                <FormInput
                  label={
                    <>
                      Village <span style={{ color: "#ff3e1d" }}>*</span>
                    </>
                  }
                  id="village"
                  error={errors.village}
                  placeholder="Village"
                  type="text"
                  maxLength={50}
                  {...field}
                />
              )}
            />
            <Controller
              name="pinCode"
              control={control}
              render={({ field }) => (
                <FormInput
                  label={
                    <>
                      Pin Code <span style={{ color: "#ff3e1d" }}>*</span>
                    </>
                  }
                  id="pinCode"
                  error={errors.pinCode}
                  placeholder="Pincode"
                  type="text"
                  maxLength={6}
                  {...field}
                />
              )}
            />
            <Controller
              name="mobileNo"
              control={control}
              render={({ field }) => (
                <FormInput
                  label={
                    <>
                      Contact Number <span style={{ color: "#ff3e1d" }}>*</span>
                    </>
                  }
                  id="mobileNo"
                  error={errors.mobileNo}
                  placeholder="Mobile No."
                  type="tel"
                  maxLength={15}
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
                  disabled
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
                  id="email"
                  error={errors.email}
                  placeholder="Email ID"
                  type="email"
                  maxLength={100}
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

          <h6 style={styles.sectionHeader}>Banking & Payment Details</h6>
          <div style={styles.formGrid}>
            <Controller
              name="bankName"
              control={control}
              render={({ field }) => (
                <FormInput
                  label="Bank Name"
                  id="bankName"
                  error={errors.bankName}
                  placeholder="Bank Name"
                  type="text"
                  maxLength={100}
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
                  id="branchName"
                  error={errors.branchName}
                  placeholder="Bank Branch Name"
                  type="text"
                  maxLength={100}
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
                  id="accountNo"
                  error={errors.accountNo}
                  placeholder="Account No"
                  type="text"
                  maxLength={30}
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
                  placeholder="IFS Code"
                  type="text"
                  maxLength={20}
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
                  id="panNo"
                  error={errors.panNo}
                  placeholder="Pan No"
                  type="text"
                  maxLength={10}
                  {...field}
                />
              )}
            />
            <Controller
              name="aadharNo"
              control={control}
              render={({ field }) => (
                <FormInput
                  label={<>Aadhar No.</>}
                  id="aadharNo"
                  error={errors.aadharNo}
                  placeholder="Aadhar No"
                  type="text"
                  maxLength={12}
                  {...field}
                />
              )}
            />
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
              onClick={handleCancelAsthaDidi}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...styles.btnPrimary,
                opacity: !isFormEnabled ? 0.5 : 1,
              }}
              disabled={!isFormEnabled}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AsthaDidiForm;

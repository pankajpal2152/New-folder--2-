import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Select from "react-select";
import { toast } from "react-toastify";
import {
  API_BASE_URL,
  FormInput,
  indianPhoneRegex,
  styles,
} from "../../config/constants";
import {
  getSafeUser,
  PasswordInput,
  validateUniqueFields,
} from "../AccountSharedUtils";

const stateSuperAdminSchema = z.object({
  stateNgoName: z.string().trim().min(2, "State NGO name is required"),
  registrationNo: z.string().trim().min(1, "Registration number is required"),
  registrationDate: z.string().min(1, "Registration date is required"),
  sdpName: z
    .string()
    .trim()
    .min(2, "Secretary/Director/President name is required"),
  mailId: z.string().trim().email("Valid email required"),
  phoneNo: z
    .string()
    .trim()
    .regex(indianPhoneRegex, "Valid Indian phone required"),
  state: z
    .object({ value: z.any(), label: z.string() })
    .nullable()
    .refine((value) => !!value, { message: "State is required" }),
  district: z
    .object({ value: z.any(), label: z.string() })
    .nullable()
    .refine((value) => !!value, { message: "District is required" }),
  blockName: z.string().trim().min(1, "Block name is required"),
  bankName: z.string().trim().min(1, "Bank Name is required"),
  accountNo: z.string().trim().min(1, "Account Number is required"),
  ifsCode: z.string().trim().min(1, "IFS Code is required"),
  bankAddress: z.string().trim().min(1, "Bank Address is required"),
  accountHolderName: z
    .string()
    .trim()
    .min(1, "Account Holder Name is required"),
  accountType: z.string().trim().min(1, "Bank Account Type is required"),
  userName: z
    .string()
    .trim()
    .min(1, "User name is required")
    .max(10, "User name must be 10 characters or less"),
  signupEmail: z.string().trim().email("Valid login email required"),
  password: z.string().refine((value) => value.trim().length > 0, {
    message: "Password is required",
  }),
});

const defaultValues = {
  stateNgoName: "",
  registrationNo: "",
  registrationDate: "",
  sdpName: "",
  mailId: "",
  phoneNo: "",
  state: null,
  district: null,
  blockName: "",
  bankName: "",
  accountNo: "",
  ifsCode: "",
  bankAddress: "",
  accountHolderName: "",
  accountType: "",
  userName: "",
  signupEmail: "",
  password: "",
};

const getLoggedNationalNgoId = (externalFilters) => {
  const user = getSafeUser();
  return (
    externalFilters?.filterNationalNgo?.value ||
    user?.AcctId ||
    user?.ProfileRegId ||
    user?.id ||
    null
  );
};

const StateSuperAdminForm = ({ onSuccess, externalFilters }) => {
  const [dbStates, setDbStates] = useState([]);
  const [dbDistricts, setDbDistricts] = useState([]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(stateSuperAdminSchema),
    mode: "onChange",
    defaultValues,
  });

  const selectedState = watch("state");
  const stateNgoName = watch("stateNgoName");

  useEffect(() => {
    setValue("userName", (stateNgoName || "").slice(0, 10), {
      shouldValidate: true,
    });
  }, [stateNgoName, setValue]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/states`)
      .then((res) => res.json())
      .then((data) =>
        setDbStates(
          data.map((state) => ({
            value: state.StateId,
            label: state.StateName,
          })),
        ),
      )
      .catch(() => toast.error("Failed to load states."));
  }, []);

  useEffect(() => {
    if (!selectedState?.value) {
      setDbDistricts([]);
      setValue("district", null);
      return;
    }

    fetch(`${API_BASE_URL}/districts/${selectedState.value}`)
      .then((res) => res.json())
      .then((data) =>
        setDbDistricts(
          data.map((district) => ({
            value: district.DistId,
            label: district.DistName,
          })),
        ),
      )
      .catch(() => toast.error("Failed to load districts."));
  }, [selectedState, setValue]);

  const handleCancel = () => {
    reset(defaultValues);
    setDbDistricts([]);
  };

  const onSubmit = async (data) => {
    const nationalNgoId = getLoggedNationalNgoId(externalFilters);
    if (!nationalNgoId) {
      toast.error("National NGO account reference was not found.");
      return;
    }

    const checks = [
      {
        table: "state_ngo_reg",
        column: "StateNGOMailId",
        value: data.mailId,
        label: "Email ID",
      },
      {
        table: "state_ngo_reg",
        column: "StateNGOPhoneNo",
        value: data.phoneNo,
        label: "Contact Number",
      },
      {
        table: "state_ngo_reg",
        column: "StateNGOSignupEmail",
        value: data.signupEmail,
        label: "Login Email",
      },
      {
        table: "state_ngo_reg",
        column: "StateNGOSignupUserName",
        value: data.userName,
        label: "Username",
      },
    ];

    if (!(await validateUniqueFields(checks))) return;

    const payload = {
      StateNGOName: data.stateNgoName,
      StateNGORegNo: data.registrationNo,
      StateNGORegDate: data.registrationDate,
      StateNGOSDPName: data.sdpName,
      StateNGOMailId: data.mailId,
      StateNGOPhoneNo: data.phoneNo,
      StateNGOStateId: data.state.value,
      StateNGODistId: data.district.value,
      StateNGOBlockName: data.blockName,
      StateNGOBankName: data.bankName,
      StateNGOAcctNo: data.accountNo,
      StateNGOIFSCode: data.ifsCode,
      StateNGOBankAdd: data.bankAddress,
      StateNGOAcctHoldeName: data.accountHolderName,
      StateNGOBankAcctType: data.accountType,
      StateNGOSignupUserName: data.userName,
      StateNGOSignupEmail: data.signupEmail,
      StateNGOSignupPassword: data.password,
      StateNGOIsActive: 1,
      StateNGOAprovedBy: null,
      StateNGOAprovedDate: null,
      AcctHead: "SN",
      AcctId: nationalNgoId,
    };

    try {
      toast.loading("Saving State Super Administrator...", {
        toastId: "savingStateNgo",
      });
      const response = await fetch(`${API_BASE_URL}/statengo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast.dismiss("savingStateNgo");

      if (!response.ok) {
        toast.error("Failed to save State Super Administrator.");
        return;
      }

      toast.success("State Super Administrator saved successfully.");
      handleCancel();
      if (onSuccess) onSuccess();
    } catch {
      toast.dismiss("savingStateNgo");
      toast.error("Network error. Could not reach server.");
    }
  };

  const onError = () =>
    toast.error("Form Error: Please check the highlighted fields.");

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h5>State Super Administrator Registration</h5>
      </div>
      <div style={styles.cardBody}>
        <form onSubmit={handleSubmit(onSubmit, onError)} autoComplete="off">
          <h6 style={styles.sectionHeader}>State NGO Details</h6>
          <div style={styles.formGrid}>
            <Controller
              name="stateNgoName"
              control={control}
              render={({ field }) => (
                <FormInput
                  label="State NGO Name *"
                  id="stateNgoName"
                  error={errors.stateNgoName}
                  type="text"
                  {...field}
                />
              )}
            />
            <Controller
              name="registrationNo"
              control={control}
              render={({ field }) => (
                <FormInput
                  label="Registration No *"
                  id="registrationNo"
                  error={errors.registrationNo}
                  type="text"
                  {...field}
                />
              )}
            />
            <Controller
              name="registrationDate"
              control={control}
              render={({ field }) => (
                <FormInput
                  label="Registration Date *"
                  id="registrationDate"
                  error={errors.registrationDate}
                  type="date"
                  {...field}
                />
              )}
            />
            <Controller
              name="sdpName"
              control={control}
              render={({ field }) => (
                <FormInput
                  label="Secretary/Director/President Name *"
                  id="sdpName"
                  error={errors.sdpName}
                  type="text"
                  {...field}
                />
              )}
            />
            <Controller
              name="mailId"
              control={control}
              render={({ field }) => (
                <FormInput
                  label="State NGO Email ID *"
                  id="mailId"
                  error={errors.mailId}
                  type="email"
                  {...field}
                />
              )}
            />
            <Controller
              name="phoneNo"
              control={control}
              render={({ field }) => (
                <FormInput
                  label="State NGO Phone No *"
                  id="phoneNo"
                  error={errors.phoneNo}
                  type="tel"
                  {...field}
                />
              )}
            />
          </div>

          <h6 style={styles.sectionHeader}>Area Details</h6>
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
                    styles={styles.selectStyles(!!errors.state)}
                    placeholder="Select State"
                  />
                )}
              />
              {errors.state && (
                <p style={styles.errorText}>{errors.state.message}</p>
              )}
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
                    styles={styles.selectStyles(!!errors.district)}
                    placeholder="Select District"
                    isDisabled={!selectedState}
                  />
                )}
              />
              {errors.district && (
                <p style={styles.errorText}>{errors.district.message}</p>
              )}
            </div>
            <Controller
              name="blockName"
              control={control}
              render={({ field }) => (
                <FormInput
                  label="Block Name *"
                  id="blockName"
                  error={errors.blockName}
                  type="text"
                  {...field}
                />
              )}
            />
          </div>

          <h6 style={styles.sectionHeader}>Bank Details</h6>
          <div style={styles.formGrid}>
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
            <Controller
              name="accountHolderName"
              control={control}
              render={({ field }) => (
                <FormInput
                  label="Account Holder Name"
                  id="accountHolderName"
                  error={errors.accountHolderName}
                  type="text"
                  {...field}
                />
              )}
            />
            <Controller
              name="accountType"
              control={control}
              render={({ field }) => (
                <FormInput
                  label="Bank Account Type"
                  id="accountType"
                  error={errors.accountType}
                  type="text"
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
                  id="userName"
                  error={errors.userName}
                  type="text"
                  maxLength={10}
                  {...field}
                />
              )}
            />
            <Controller
              name="signupEmail"
              control={control}
              render={({ field }) => (
                <FormInput
                  label="Email ID (For Login) *"
                  id="signupEmail"
                  error={errors.signupEmail}
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
                  label="Set New Password *"
                  id="password"
                  error={errors.password}
                  autoComplete="new-password"
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

export default StateSuperAdminForm;

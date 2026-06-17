import React, { useCallback, useEffect, useMemo, useState } from "react";
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
} from "../config/constants";
import {
  getSafeUser,
  PasswordInput,
  validateUniqueFields,
} from "./AccountSharedUtils";

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

const formatDisplayDate = (dateValue) => {
  if (!dateValue) return "-";
  return String(dateValue).substring(0, 10);
};

const getFormDate = (dateValue) => {
  if (!dateValue) return "";
  return String(dateValue).substring(0, 10);
};

const getIstDate = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 5.5).toISOString().split("T")[0];
};

const getCurrentUser = () => {
  const user = getSafeUser();
  return {
    user,
    role: user?.role || user?.UserSignUpRole || "",
    id:
      user?.AcctId ||
      user?.ProfileRegId ||
      user?.UserSignUpId ||
      user?.id ||
      "",
  };
};

const StateSuperAdminModal = ({ member, mode, onClose, onSuccess }) => {
  const isView = mode === "view";
  const [dbStates, setDbStates] = useState([]);
  const [dbDistricts, setDbDistricts] = useState([]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(stateSuperAdminSchema),
    mode: "onChange",
    defaultValues: {
      stateNgoName: member.StateNGOName || "",
      registrationNo: member.StateNGORegNo || "",
      registrationDate: getFormDate(member.StateNGORegDate),
      sdpName: member.StateNGOSDPName || "",
      mailId: member.StateNGOMailId || "",
      phoneNo: member.StateNGOPhoneNo || "",
      state: null,
      district: null,
      blockName: member.StateNGOBlockName || "",
      bankName: member.StateNGOBankName || "",
      accountNo: member.StateNGOAcctNo || "",
      ifsCode: member.StateNGOIFSCode || "",
      bankAddress: member.StateNGOBankAdd || "",
      accountHolderName: member.StateNGOAcctHoldeName || "",
      accountType: member.StateNGOBankAcctType || "",
      userName: member.StateNGOSignupUserName || "",
      signupEmail: member.StateNGOSignupEmail || "",
      password: member.StateNGOSignupPassword || "",
    },
  });

  const selectedState = watch("state");

  useEffect(() => {
    const initializeModalData = async () => {
      try {
        const stateRes = await fetch(`${API_BASE_URL}/states`);
        const stateData = await stateRes.json();
        const formattedStates = stateData.map((state) => ({
          value: state.StateId,
          label: state.StateName,
        }));
        setDbStates(formattedStates);

        const matchedState =
          formattedStates.find(
            (state) => String(state.value) === String(member.StateNGOStateId),
          ) ||
          formattedStates.find(
            (state) =>
              state.label.trim().toLowerCase() ===
              String(member.StateNGOStateName || "")
                .trim()
                .toLowerCase(),
          );

        if (!matchedState) return;
        setValue("state", matchedState, { shouldValidate: true });

        const districtRes = await fetch(
          `${API_BASE_URL}/districts/${matchedState.value}`,
        );
        const districtData = await districtRes.json();
        const formattedDistricts = districtData.map((district) => ({
          value: district.DistId,
          label: district.DistName,
        }));
        setDbDistricts(formattedDistricts);

        const matchedDistrict =
          formattedDistricts.find(
            (district) =>
              String(district.value) === String(member.StateNGODistId),
          ) ||
          formattedDistricts.find(
            (district) =>
              district.label.trim().toLowerCase() ===
              String(member.StateNGODistName || "")
                .trim()
                .toLowerCase(),
          );

        if (matchedDistrict) {
          setValue("district", matchedDistrict, { shouldValidate: true });
        }
      } catch {
        toast.error("Failed to initialize State Super Administrator record.");
      }
    };

    initializeModalData();
  }, [member, setValue]);

  useEffect(() => {
    if (!selectedState?.value) {
      setDbDistricts([]);
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
      .catch(() => {});
  }, [selectedState]);

  const renderInput = (name, label, id, type = "text", extraProps = {}) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormInput
          label={label}
          id={id}
          type={type}
          error={errors[name]}
          disabled={isView}
          {...extraProps}
          {...field}
        />
      )}
    />
  );

  const onSubmit = async (data) => {
    if (isView) {
      onClose();
      return;
    }

    const checks = [
      {
        table: "state_ngo_reg",
        column: "StateNGOMailId",
        value: data.mailId,
        idColumn: "StateNGORegId",
        idValue: member.StateNGORegId,
        label: "Email ID",
      },
      {
        table: "state_ngo_reg",
        column: "StateNGOPhoneNo",
        value: data.phoneNo,
        idColumn: "StateNGORegId",
        idValue: member.StateNGORegId,
        label: "Contact Number",
      },
      {
        table: "state_ngo_reg",
        column: "StateNGOSignupEmail",
        value: data.signupEmail,
        idColumn: "StateNGORegId",
        idValue: member.StateNGORegId,
        label: "Login Email",
      },
      {
        table: "state_ngo_reg",
        column: "StateNGOSignupUserName",
        value: data.userName,
        idColumn: "StateNGORegId",
        idValue: member.StateNGORegId,
        label: "Username",
      },
    ];

    if (!(await validateUniqueFields(checks))) return;

    const payload = {
      ...member,
      StateNGOName: data.stateNgoName,
      StateNGORegNo: data.registrationNo,
      StateNGORegDate: data.registrationDate,
      StateNGOSDPName: data.sdpName,
      StateNGOMailId: data.mailId,
      StateNGOPhoneNo: data.phoneNo,
      StateNGOStateId: data.state?.value || member.StateNGOStateId,
      StateNGODistId: data.district?.value || member.StateNGODistId,
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
      StateNGOIsActive: member.StateNGOIsActive ?? 1,
      AcctHead: member.AcctHead || "SN",
      AcctId: member.AcctId,
    };

    try {
      toast.loading("Updating State Super Administrator...", {
        toastId: "updateStateNgo",
      });
      const response = await fetch(
        `${API_BASE_URL}/statengo/${member.StateNGORegId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      toast.dismiss("updateStateNgo");

      if (!response.ok) {
        toast.error("Failed to update record.");
        return;
      }

      toast.success("Record updated.");
      onSuccess();
    } catch {
      toast.dismiss("updateStateNgo");
      toast.error("Network error.");
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modalContent, maxWidth: "1000px", padding: 0 }}>
        <div style={styles.cardHeader}>
          <h5 style={{ margin: 0 }}>
            {isView ? "View" : "Edit"} State Super Administrator
          </h5>
          <button style={styles.closeBtn} onClick={onClose} type="button">
            x
          </button>
        </div>
        <div style={styles.cardBody}>
          <p style={styles.hintText}>
            <strong>Status:</strong>{" "}
            {Number(member.StateNGOIsActive) === 2 ? "Approved" : "Pending"}
          </p>
          {Number(member.StateNGOIsActive) === 2 && (
            <p style={styles.hintText}>
              <strong>Approved By:</strong>{" "}
              {member.ApproverDisplayName || member.StateNGOAprovedBy || "-"} |{" "}
              <strong>Approval Date:</strong>{" "}
              {formatDisplayDate(member.StateNGOAprovedDate)}
            </p>
          )}

          <form
            onSubmit={handleSubmit(
              onSubmit,
              () => !isView && toast.error("Please check highlighted fields."),
            )}
          >
            <h6 style={styles.sectionHeader}>State NGO Details</h6>
            <div style={styles.formGrid}>
              {renderInput(
                "stateNgoName",
                "State NGO Name *",
                "m_stateNgoName",
              )}
              {renderInput("registrationNo", "Registration No *", "m_regNo")}
              {renderInput(
                "registrationDate",
                "Registration Date *",
                "m_regDate",
                "date",
              )}
              {renderInput(
                "sdpName",
                "Secretary/Director/President Name *",
                "m_sdpName",
              )}
              {renderInput(
                "mailId",
                "State NGO Email ID *",
                "m_mailId",
                "email",
              )}
              {renderInput(
                "phoneNo",
                "State NGO Phone No *",
                "m_phoneNo",
                "tel",
              )}
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
                      isDisabled={isView}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
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
                      isDisabled={isView || !selectedState}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  )}
                />
                {errors.district && (
                  <p style={styles.errorText}>{errors.district.message}</p>
                )}
              </div>
              {renderInput("blockName", "Block Name *", "m_blockName")}
            </div>

            <h6 style={styles.sectionHeader}>Bank Details</h6>
            <div style={styles.formGrid}>
              {renderInput("bankName", "Bank Name", "m_bankName")}
              {renderInput("accountNo", "Account Number", "m_accountNo")}
              {renderInput("ifsCode", "IFS Code", "m_ifsCode")}
              {renderInput("bankAddress", "Bank Address", "m_bankAddress")}
              {renderInput(
                "accountHolderName",
                "Account Holder Name",
                "m_accountHolder",
              )}
              {renderInput("accountType", "Bank Account Type", "m_accountType")}
            </div>

            <h6 style={styles.sectionHeader}>Login & Account Setup</h6>
            <div style={styles.formGrid}>
              {renderInput("userName", "User Name *", "m_userName", "text", {
                maxLength: 10,
              })}
              {renderInput(
                "signupEmail",
                "Email ID (For Login) *",
                "m_signupEmail",
                "email",
              )}
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <PasswordInput
                    label="Set New Password *"
                    id="m_password"
                    error={errors.password}
                    disabled={isView}
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
              <button type="button" onClick={onClose} style={styles.btnOutline}>
                {isView ? "Close" : "Cancel"}
              </button>
              {!isView && (
                <button type="submit" style={styles.btnPrimary}>
                  Save
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const StateSuperAdminTable = ({ refreshTrigger, externalFilters }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [modalMode, setModalMode] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);

  const canManage = userRole.toLowerCase() === "national ngo";

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/statengo`);
      if (!response.ok) throw new Error("Failed to fetch data");
      let data = await response.json();

      // ✅ Strict enforcement to hide records where StateNGOIsActive === "0"
      data = data.filter((member) => String(member.StateNGOIsActive) !== "0");

      setMembers(data);
    } catch {
      toast.error("Failed to load State Super Administrator table data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUserRole(currentUser.role);
    setUserId(currentUser.id);
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [refreshTrigger, fetchMembers]);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (!globalSearch) return true;
      const searchLower = globalSearch.toLowerCase();
      return Object.values(member).some(
        (value) => value && String(value).toLowerCase().includes(searchLower),
      );
    });
  }, [members, globalSearch]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMembers.length / rowsPerPage),
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [currentPage, totalPages]);

  const currentTableData = filteredMembers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const closeModal = () => {
    setSelectedRow(null);
    setModalMode("");
    setShowDeleteModal(false);
    setShowApproveModal(false);
  };

  const openModal = (type, row) => {
    setSelectedRow({ ...row });
    if (type === "delete") {
      setShowDeleteModal(true);
      return;
    }
    if (type === "approve") {
      setShowApproveModal(true);
      return;
    }
    setModalMode(type);
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Deleting record...", { toastId: "deleteStateNgo" });
      const payload = { ...selectedRow, StateNGOIsActive: 0 };
      const response = await fetch(
        `${API_BASE_URL}/statengo/${selectedRow.StateNGORegId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      toast.dismiss("deleteStateNgo");

      if (!response.ok) {
        toast.error("Failed to delete record.");
        return;
      }

      toast.success("Record deleted.");
      closeModal();
      fetchMembers();
    } catch {
      toast.dismiss("deleteStateNgo");
      toast.error("Network error.");
    }
  };

  const confirmApprove = async () => {
    try {
      toast.loading("Approving record...", { toastId: "approveStateNgo" });
      const payload = {
        ...selectedRow,
        StateNGOIsActive: 2,
        StateNGOAprovedBy: String(userId),
        StateNGOAprovedDate: getIstDate(),
      };
      const response = await fetch(
        `${API_BASE_URL}/statengo/${selectedRow.StateNGORegId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      toast.dismiss("approveStateNgo");

      if (!response.ok) {
        toast.error("Failed to approve record.");
        return;
      }

      toast.success("Record approved.");
      closeModal();
      fetchMembers();
    } catch {
      toast.dismiss("approveStateNgo");
      toast.error("Network error.");
    }
  };

  const tableHeaders = [
    "State NGO Name",
    "Reg No",
    "Reg Date",
    "SDP Name",
    "Email",
    "Phone",
    "State",
    "District",
    "Block",
    "Bank Name",
    "Account No",
    "IFS Code",
    "Bank Address",
    "Account Holder",
    "Account Type",
    "Username",
    "Login Email",
    "Password",
    "National NGO",
    "Status",
    "Approved By",
    "Approval Date",
    "Actions",
  ];

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
        <h5 style={{ margin: 0 }}>State Super Administrators</h5>
        <button onClick={fetchMembers} style={styles.btnOutline} type="button">
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
            placeholder="Search..."
            value={globalSearch}
            onChange={(event) => {
              setGlobalSearch(event.target.value);
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
                  {tableHeaders.map((header) => (
                    <th style={styles.th} key={header}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentTableData.map((row) => (
                  <tr key={row.StateNGORegId}>
                    <td style={styles.td}>{row.StateNGOName}</td>
                    <td style={styles.td}>{row.StateNGORegNo}</td>
                    <td style={styles.td}>
                      {formatDisplayDate(row.StateNGORegDate)}
                    </td>
                    <td style={styles.td}>{row.StateNGOSDPName}</td>
                    <td style={styles.td}>{row.StateNGOMailId}</td>
                    <td style={styles.td}>{row.StateNGOPhoneNo}</td>
                    <td style={styles.td}>
                      {row.StateNGOStateName || row.StateNGOStateId}
                    </td>
                    <td style={styles.td}>
                      {row.StateNGODistName || row.StateNGODistId}
                    </td>
                    <td style={styles.td}>{row.StateNGOBlockName}</td>
                    <td style={styles.td}>{row.StateNGOBankName}</td>
                    <td style={styles.td}>{row.StateNGOAcctNo}</td>
                    <td style={styles.td}>{row.StateNGOIFSCode}</td>
                    <td style={styles.td}>{row.StateNGOBankAdd}</td>
                    <td style={styles.td}>{row.StateNGOAcctHoldeName}</td>
                    <td style={styles.td}>{row.StateNGOBankAcctType}</td>
                    <td style={styles.td}>{row.StateNGOSignupUserName}</td>
                    <td style={styles.td}>{row.StateNGOSignupEmail}</td>
                    <td style={styles.td}>{row.StateNGOSignupPassword}</td>
                    <td style={styles.td}>
                      {row.NationalNgoName || row.AcctId}
                    </td>
                    <td
                      style={{
                        ...styles.td,
                        color:
                          Number(row.StateNGOIsActive) === 2
                            ? "green"
                            : "orange",
                      }}
                    >
                      {Number(row.StateNGOIsActive) === 2
                        ? "Approved"
                        : "Pending"}
                    </td>
                    <td style={styles.td}>
                      {row.ApproverDisplayName || row.StateNGOAprovedBy || "-"}
                    </td>
                    <td style={styles.td}>
                      {formatDisplayDate(row.StateNGOAprovedDate)}
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => openModal("view", row)}
                        style={styles.actionBtn}
                        type="button"
                      >
                        View
                      </button>
                      {canManage && (
                        <>
                          <button
                            onClick={() => openModal("edit", row)}
                            style={styles.actionBtn}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openModal("delete", row)}
                            style={styles.actionBtn}
                            type="button"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {canManage && Number(row.StateNGOIsActive) !== 2 && (
                        <button
                          onClick={() => openModal("approve", row)}
                          style={styles.actionBtn}
                          type="button"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredMembers.length === 0 && (
                  <tr>
                    <td
                      colSpan={tableHeaders.length}
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      No State Super Administrator records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {filteredMembers.length > 0 && (
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <label>Rows: </label>
              <select
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                style={styles.btnOutline}
                type="button"
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
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {modalMode && selectedRow && (
        <StateSuperAdminModal
          member={selectedRow}
          mode={modalMode}
          onClose={closeModal}
          onSuccess={() => {
            closeModal();
            fetchMembers();
          }}
        />
      )}

      {showDeleteModal && selectedRow && (
        <div style={styles.modalOverlay}>
          <div
            style={{
              ...styles.modalContent,
              maxWidth: "420px",
              textAlign: "center",
            }}
          >
            <h4>Confirm Delete</h4>
            <p>Delete {selectedRow.StateNGOName}?</p>
            <div
              style={{ display: "flex", justifyContent: "center", gap: "12px" }}
            >
              <button
                onClick={closeModal}
                style={styles.btnOutline}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={styles.btnDanger}
                type="button"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showApproveModal && selectedRow && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: "520px" }}>
            <h4
              style={{
                marginBottom: "16px",
                borderBottom: "1px solid #eee",
                paddingBottom: "10px",
              }}
            >
              Approve State Super Administrator
            </h4>
            <p>
              <strong>Approving Authority:</strong> {userRole} (ID: {userId})
            </p>
            <p>
              <strong>State NGO:</strong> {selectedRow.StateNGOName}
            </p>
            <p>
              <strong>State:</strong>{" "}
              {selectedRow.StateNGOStateName || selectedRow.StateNGOStateId} |{" "}
              <strong>District:</strong>{" "}
              {selectedRow.StateNGODistName || selectedRow.StateNGODistId}
            </p>
            <p>
              <strong>Approval Date:</strong> {getIstDate()}
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "24px",
              }}
            >
              <button
                onClick={closeModal}
                style={styles.btnOutline}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                style={styles.btnSuccess}
                type="button"
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

export default StateSuperAdminTable;

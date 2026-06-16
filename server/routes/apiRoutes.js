const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const formController = require("../controllers/formController");

// --- AUTHENTICATION & ROLE MANAGEMENT ROUTES ---
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/userinfo", authController.getUserInfo);
router.post("/userinfo", authController.createUserRole);
router.put("/userinfo/:id", authController.updateUserRole);
router.delete("/userinfo/:id", authController.deleteUserRole);

// --- GENERAL DROPDOWN ROUTES ---
router.get("/states", formController.getStates);
router.get("/districts/:stateId", formController.getDistricts);
router.get("/filter/states", formController.getFilterStates);
router.get("/filter/districts/:stateId", formController.getFilterDistricts);
router.get("/nationalngo", formController.getNationalNgos);

// --- LOCATION MANAGEMENT (NEW) ---
router.get("/manage/states", formController.getAllStates);
router.post("/manage/states", formController.createState);
router.put("/manage/states/:id", formController.updateState);
router.delete("/manage/states/:id", formController.deleteState);

router.get("/manage/districts", formController.getAllDistricts);
router.post("/manage/districts", formController.createDistrict);
router.put("/manage/districts/:id", formController.updateDistrict);
router.delete("/manage/districts/:id", formController.deleteDistrict);

// --- REGISTRATION ROUTES ---
router.get("/statengo", formController.getStateNgo);
router.post("/statengo", formController.createStateNgo);
router.put("/statengo/:id", formController.updateStateNgo);
router.delete("/statengo/:id", formController.deleteStateNgo);

router.get("/asthadidi", formController.getAsthaDidi);
router.post("/asthadidi", formController.createAsthaDidi);
router.put("/asthadidi/:id", formController.updateAsthaDidi);
router.delete("/asthadidi/:id", formController.deleteAsthaDidi);

router.get("/asthamaa", formController.getAsthaMaa);
router.post("/asthamaa", formController.createAsthaMaa);
router.put("/asthamaa/:id", formController.updateAsthaMaa);
router.delete("/asthamaa/:id", formController.deleteAsthaMaa);

router.get("/districtadmin", formController.getDistrictAdmin);
router.post("/districtadmin", formController.createDistrictAdmin);
router.put("/districtadmin/:id", formController.updateDistrictAdmin);
router.delete("/districtadmin/:id", formController.deleteDistrictAdmin);

router.get("/supervisor", formController.getSupervisor);
router.post("/supervisor", formController.createSupervisor);
router.put("/supervisor/:id", formController.updateSupervisor);
router.delete("/supervisor/:id", formController.deleteSupervisor);

router.post("/check-duplicate", formController.checkDuplicate);

// --- PRODUCT DISTRIBUTION ROUTES ---
router.get("/accthead", formController.getAccountHeads);
router.get("/accounts-mapping", formController.getAccountsMapping);
router.get("/products", formController.getActiveProducts);
router.get("/stock", formController.getProductStock);
router.get("/trntypes", formController.getTrnTypes);
router.get(
  "/juniors-for-distribution",
  formController.getJuniorsForDistribution,
);
router.get("/supervisors-by-dist/:distId", formController.getSupervisorsByDist);
router.get("/distribution-history", formController.getDistributionHistory);
router.post("/distribute", formController.distributeProduct);

module.exports = router;

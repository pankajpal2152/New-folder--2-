const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const formController = require('../controllers/formController');

// --- AUTHENTICATION & ROLE MANAGEMENT ROUTES ---
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/userinfo', authController.getUserInfo);
router.post('/userinfo', authController.createUserRole);
router.put('/userinfo/:id', authController.updateUserRole);
router.delete('/userinfo/:id', authController.deleteUserRole);

// --- GENERAL DROPDOWN ROUTES (Used in Forms) ---
router.get('/states', formController.getStates);
router.get('/districts/:stateId', formController.getDistricts);

// --- STRICT FILTER DROPDOWN ROUTES (Used for External Table Filters) ---
router.get('/filter/states', formController.getFilterStates);
router.get('/filter/districts/:stateId', formController.getFilterDistricts);

// --- ASTHA DIDI ROUTES ---
router.get('/asthadidi', formController.getAsthaDidi);
router.post('/asthadidi', formController.createAsthaDidi);
router.put('/asthadidi/:id', formController.updateAsthaDidi);
router.delete('/asthadidi/:id', formController.deleteAsthaDidi);

// --- ASTHA MAA ROUTES ---
router.get('/asthamaa', formController.getAsthaMaa);
router.post('/asthamaa', formController.createAsthaMaa);
router.put('/asthamaa/:id', formController.updateAsthaMaa);
router.delete('/asthamaa/:id', formController.deleteAsthaMaa);

// --- DISTRICT ADMIN ROUTES ---
router.get('/districtadmin', formController.getDistrictAdmin);
router.post('/districtadmin', formController.createDistrictAdmin);
router.put('/districtadmin/:id', formController.updateDistrictAdmin);
router.delete('/districtadmin/:id', formController.deleteDistrictAdmin);

// --- SUPERVISOR ROUTES ---
router.get('/supervisor', formController.getSupervisor);
router.post('/supervisor', formController.createSupervisor);
router.put('/supervisor/:id', formController.updateSupervisor);
router.delete('/supervisor/:id', formController.deleteSupervisor);

module.exports = router;
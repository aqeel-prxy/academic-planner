const express = require('express');
const router = express.Router();
const moduleController = require('../controller/moduleController');
const { validateModule } = require('../middleware/validation');

// GET all modules
router.get('/', moduleController.getAllModules);

// GET modules by semester
router.get('/semester', moduleController.getModulesBySemester);

// GET single module
router.get('/:id', moduleController.getModuleById);

// POST create new module
router.post('/', validateModule, moduleController.createModule);

// PUT update module
router.put('/:id', moduleController.updateModule);

// DELETE module
router.delete('/:id', moduleController.deleteModule);

console.log('✅ Module routes loaded successfully');

module.exports = router;

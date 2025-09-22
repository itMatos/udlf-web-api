"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_service_1 = require("../services/settings.service");
const settings_controller_1 = require("../controllers/settings.controller");
const router = (0, express_1.Router)();
const settingsService = new settings_service_1.SettingsService();
const settingsController = new settings_controller_1.SettingsController(settingsService);
/**
 * Validate if a path exists and is accessible
 * POST /api/settings/validate-path
 */
router.post('/validate-path', (req, res) => {
    settingsController.validatePath(req, res);
});
/**
 * Update application settings
 * POST /api/settings/update
 */
router.post('/update', (req, res) => {
    settingsController.updateSettings(req, res);
});
/**
 * Get current settings
 * GET /api/settings/current
 */
router.get('/current', (req, res) => {
    settingsController.getSettings(req, res);
});
exports.default = router;

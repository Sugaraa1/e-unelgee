"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Claim = exports.AccidentType = exports.AccidentSeverity = exports.ClaimStatus = void 0;
var typeorm_1 = require("typeorm");
var user_entity_1 = require("../../users/entities/user.entity");
var vehicle_entity_1 = require("../../vehicles/entities/vehicle.entity");
var image_entity_1 = require("../../images/entities/image.entity");
var damage_assessment_entity_1 = require("../../damage-assessment/entities/damage-assessment.entity");
var ClaimStatus;
(function (ClaimStatus) {
    ClaimStatus["DRAFT"] = "draft";
    ClaimStatus["SUBMITTED"] = "submitted";
    ClaimStatus["UNDER_REVIEW"] = "under_review";
    ClaimStatus["AI_PROCESSING"] = "ai_processing";
    ClaimStatus["PENDING_INSPECTION"] = "pending_inspection";
    ClaimStatus["APPROVED"] = "approved";
    ClaimStatus["PARTIALLY_APPROVED"] = "partially_approved";
    ClaimStatus["REJECTED"] = "rejected";
    ClaimStatus["CLOSED"] = "closed";
})(ClaimStatus || (exports.ClaimStatus = ClaimStatus = {}));
var AccidentSeverity;
(function (AccidentSeverity) {
    AccidentSeverity["MINOR"] = "minor";
    AccidentSeverity["MODERATE"] = "moderate";
    AccidentSeverity["SEVERE"] = "severe";
    AccidentSeverity["TOTAL_LOSS"] = "total_loss";
})(AccidentSeverity || (exports.AccidentSeverity = AccidentSeverity = {}));
var AccidentType;
(function (AccidentType) {
    AccidentType["COLLISION"] = "collision";
    AccidentType["REAR_END"] = "rear_end";
    AccidentType["SIDE_IMPACT"] = "side_impact";
    AccidentType["ROLLOVER"] = "rollover";
    AccidentType["HIT_AND_RUN"] = "hit_and_run";
    AccidentType["WEATHER"] = "weather";
    AccidentType["VANDALISM"] = "vandalism";
    AccidentType["THEFT"] = "theft";
    AccidentType["FIRE"] = "fire";
    AccidentType["FLOOD"] = "flood";
    AccidentType["OTHER"] = "other";
})(AccidentType || (exports.AccidentType = AccidentType = {}));
var Claim = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('claims')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _claimNumber_decorators;
    var _claimNumber_initializers = [];
    var _claimNumber_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _accidentDate_decorators;
    var _accidentDate_initializers = [];
    var _accidentDate_extraInitializers = [];
    var _accidentLocation_decorators;
    var _accidentLocation_initializers = [];
    var _accidentLocation_extraInitializers = [];
    var _latitude_decorators;
    var _latitude_initializers = [];
    var _latitude_extraInitializers = [];
    var _longitude_decorators;
    var _longitude_initializers = [];
    var _longitude_extraInitializers = [];
    var _accidentType_decorators;
    var _accidentType_initializers = [];
    var _accidentType_extraInitializers = [];
    var _severity_decorators;
    var _severity_initializers = [];
    var _severity_extraInitializers = [];
    var _description_decorators;
    var _description_initializers = [];
    var _description_extraInitializers = [];
    var _thirdPartyInvolved_decorators;
    var _thirdPartyInvolved_initializers = [];
    var _thirdPartyInvolved_extraInitializers = [];
    var _thirdPartyName_decorators;
    var _thirdPartyName_initializers = [];
    var _thirdPartyName_extraInitializers = [];
    var _thirdPartyLicensePlate_decorators;
    var _thirdPartyLicensePlate_initializers = [];
    var _thirdPartyLicensePlate_extraInitializers = [];
    var _thirdPartyInsurance_decorators;
    var _thirdPartyInsurance_initializers = [];
    var _thirdPartyInsurance_extraInitializers = [];
    var _thirdPartyPolicyNumber_decorators;
    var _thirdPartyPolicyNumber_initializers = [];
    var _thirdPartyPolicyNumber_extraInitializers = [];
    var _policeReportFiled_decorators;
    var _policeReportFiled_initializers = [];
    var _policeReportFiled_extraInitializers = [];
    var _policeReportNumber_decorators;
    var _policeReportNumber_initializers = [];
    var _policeReportNumber_extraInitializers = [];
    var _estimatedRepairCost_decorators;
    var _estimatedRepairCost_initializers = [];
    var _estimatedRepairCost_extraInitializers = [];
    var _approvedAmount_decorators;
    var _approvedAmount_initializers = [];
    var _approvedAmount_extraInitializers = [];
    var _deductibleAmount_decorators;
    var _deductibleAmount_initializers = [];
    var _deductibleAmount_extraInitializers = [];
    var _reviewedById_decorators;
    var _reviewedById_initializers = [];
    var _reviewedById_extraInitializers = [];
    var _reviewedBy_decorators;
    var _reviewedBy_initializers = [];
    var _reviewedBy_extraInitializers = [];
    var _reviewedAt_decorators;
    var _reviewedAt_initializers = [];
    var _reviewedAt_extraInitializers = [];
    var _reviewNotes_decorators;
    var _reviewNotes_initializers = [];
    var _reviewNotes_extraInitializers = [];
    var _rejectionReason_decorators;
    var _rejectionReason_initializers = [];
    var _rejectionReason_extraInitializers = [];
    var _submittedBy_decorators;
    var _submittedBy_initializers = [];
    var _submittedBy_extraInitializers = [];
    var _submittedById_decorators;
    var _submittedById_initializers = [];
    var _submittedById_extraInitializers = [];
    var _vehicle_decorators;
    var _vehicle_initializers = [];
    var _vehicle_extraInitializers = [];
    var _vehicleId_decorators;
    var _vehicleId_initializers = [];
    var _vehicleId_extraInitializers = [];
    var _images_decorators;
    var _images_initializers = [];
    var _images_extraInitializers = [];
    var _damageAssessment_decorators;
    var _damageAssessment_initializers = [];
    var _damageAssessment_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var _updatedAt_decorators;
    var _updatedAt_initializers = [];
    var _updatedAt_extraInitializers = [];
    var _deletedAt_decorators;
    var _deletedAt_initializers = [];
    var _deletedAt_extraInitializers = [];
    var Claim = _classThis = /** @class */ (function () {
        function Claim_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            // ── Claim Reference ───────────────────────────────────────────
            this.claimNumber = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _claimNumber_initializers, void 0)); // e.g. CLM-2024-001234
            this.status = (__runInitializers(this, _claimNumber_extraInitializers), __runInitializers(this, _status_initializers, void 0));
            // ── Accident Details ──────────────────────────────────────────
            this.accidentDate = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _accidentDate_initializers, void 0));
            this.accidentLocation = (__runInitializers(this, _accidentDate_extraInitializers), __runInitializers(this, _accidentLocation_initializers, void 0));
            this.latitude = (__runInitializers(this, _accidentLocation_extraInitializers), __runInitializers(this, _latitude_initializers, void 0));
            this.longitude = (__runInitializers(this, _latitude_extraInitializers), __runInitializers(this, _longitude_initializers, void 0));
            this.accidentType = (__runInitializers(this, _longitude_extraInitializers), __runInitializers(this, _accidentType_initializers, void 0));
            this.severity = (__runInitializers(this, _accidentType_extraInitializers), __runInitializers(this, _severity_initializers, void 0));
            this.description = (__runInitializers(this, _severity_extraInitializers), __runInitializers(this, _description_initializers, void 0));
            // ── Third Party Info ──────────────────────────────────────────
            this.thirdPartyInvolved = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _thirdPartyInvolved_initializers, void 0));
            this.thirdPartyName = (__runInitializers(this, _thirdPartyInvolved_extraInitializers), __runInitializers(this, _thirdPartyName_initializers, void 0));
            this.thirdPartyLicensePlate = (__runInitializers(this, _thirdPartyName_extraInitializers), __runInitializers(this, _thirdPartyLicensePlate_initializers, void 0));
            this.thirdPartyInsurance = (__runInitializers(this, _thirdPartyLicensePlate_extraInitializers), __runInitializers(this, _thirdPartyInsurance_initializers, void 0));
            this.thirdPartyPolicyNumber = (__runInitializers(this, _thirdPartyInsurance_extraInitializers), __runInitializers(this, _thirdPartyPolicyNumber_initializers, void 0));
            // ── Police Report ─────────────────────────────────────────────
            this.policeReportFiled = (__runInitializers(this, _thirdPartyPolicyNumber_extraInitializers), __runInitializers(this, _policeReportFiled_initializers, void 0));
            this.policeReportNumber = (__runInitializers(this, _policeReportFiled_extraInitializers), __runInitializers(this, _policeReportNumber_initializers, void 0));
            // ── Financial ─────────────────────────────────────────────────
            this.estimatedRepairCost = (__runInitializers(this, _policeReportNumber_extraInitializers), __runInitializers(this, _estimatedRepairCost_initializers, void 0)); // from AI assessment
            this.approvedAmount = (__runInitializers(this, _estimatedRepairCost_extraInitializers), __runInitializers(this, _approvedAmount_initializers, void 0)); // set by adjuster
            this.deductibleAmount = (__runInitializers(this, _approvedAmount_extraInitializers), __runInitializers(this, _deductibleAmount_initializers, void 0));
            // ── Review Info ───────────────────────────────────────────────
            this.reviewedById = (__runInitializers(this, _deductibleAmount_extraInitializers), __runInitializers(this, _reviewedById_initializers, void 0));
            this.reviewedBy = (__runInitializers(this, _reviewedById_extraInitializers), __runInitializers(this, _reviewedBy_initializers, void 0));
            this.reviewedAt = (__runInitializers(this, _reviewedBy_extraInitializers), __runInitializers(this, _reviewedAt_initializers, void 0));
            this.reviewNotes = (__runInitializers(this, _reviewedAt_extraInitializers), __runInitializers(this, _reviewNotes_initializers, void 0));
            this.rejectionReason = (__runInitializers(this, _reviewNotes_extraInitializers), __runInitializers(this, _rejectionReason_initializers, void 0));
            // ── Relations ─────────────────────────────────────────────────
            this.submittedBy = (__runInitializers(this, _rejectionReason_extraInitializers), __runInitializers(this, _submittedBy_initializers, void 0));
            this.submittedById = (__runInitializers(this, _submittedBy_extraInitializers), __runInitializers(this, _submittedById_initializers, void 0));
            this.vehicle = (__runInitializers(this, _submittedById_extraInitializers), __runInitializers(this, _vehicle_initializers, void 0));
            this.vehicleId = (__runInitializers(this, _vehicle_extraInitializers), __runInitializers(this, _vehicleId_initializers, void 0));
            this.images = (__runInitializers(this, _vehicleId_extraInitializers), __runInitializers(this, _images_initializers, void 0));
            this.damageAssessment = (__runInitializers(this, _images_extraInitializers), __runInitializers(this, _damageAssessment_initializers, void 0));
            // ── Timestamps ────────────────────────────────────────────────
            this.createdAt = (__runInitializers(this, _damageAssessment_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            this.deletedAt = (__runInitializers(this, _updatedAt_extraInitializers), __runInitializers(this, _deletedAt_initializers, void 0));
            __runInitializers(this, _deletedAt_extraInitializers);
        }
        Object.defineProperty(Claim_1.prototype, "isEditable", {
            // ── Hooks ─────────────────────────────────────────────────────
            // Auto-generate claim number before insert
            // (In real app, use a database sequence or service method)
            get: function () {
                return [ClaimStatus.DRAFT, ClaimStatus.SUBMITTED].includes(this.status);
            },
            enumerable: false,
            configurable: true
        });
        return Claim_1;
    }());
    __setFunctionName(_classThis, "Claim");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _claimNumber_decorators = [(0, typeorm_1.Index)({ unique: true }), (0, typeorm_1.Column)({ length: 20 })];
        _status_decorators = [(0, typeorm_1.Column)({ type: 'enum', enum: ClaimStatus, default: ClaimStatus.DRAFT })];
        _accidentDate_decorators = [(0, typeorm_1.Column)({ type: 'timestamp' })];
        _accidentLocation_decorators = [(0, typeorm_1.Column)({ length: 500 })];
        _latitude_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 8, nullable: true })];
        _longitude_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 11, scale: 8, nullable: true })];
        _accidentType_decorators = [(0, typeorm_1.Column)({ type: 'enum', enum: AccidentType })];
        _severity_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: AccidentSeverity,
                nullable: true, // set after AI assessment
            })];
        _description_decorators = [(0, typeorm_1.Column)({ type: 'text' })];
        _thirdPartyInvolved_decorators = [(0, typeorm_1.Column)({ default: false })];
        _thirdPartyName_decorators = [(0, typeorm_1.Column)({ nullable: true, length: 100 })];
        _thirdPartyLicensePlate_decorators = [(0, typeorm_1.Column)({ nullable: true, length: 20 })];
        _thirdPartyInsurance_decorators = [(0, typeorm_1.Column)({ nullable: true, length: 100 })];
        _thirdPartyPolicyNumber_decorators = [(0, typeorm_1.Column)({ nullable: true, length: 50 })];
        _policeReportFiled_decorators = [(0, typeorm_1.Column)({ default: false })];
        _policeReportNumber_decorators = [(0, typeorm_1.Column)({ nullable: true, length: 50 })];
        _estimatedRepairCost_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true })];
        _approvedAmount_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true })];
        _deductibleAmount_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true })];
        _reviewedById_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _reviewedBy_decorators = [(0, typeorm_1.ManyToOne)(function () { return user_entity_1.User; }, { nullable: true }), (0, typeorm_1.JoinColumn)({ name: 'reviewedById' })];
        _reviewedAt_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _reviewNotes_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _rejectionReason_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _submittedBy_decorators = [(0, typeorm_1.ManyToOne)(function () { return user_entity_1.User; }, function (user) { return user.claims; }, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'submittedById' })];
        _submittedById_decorators = [(0, typeorm_1.Column)()];
        _vehicle_decorators = [(0, typeorm_1.ManyToOne)(function () { return vehicle_entity_1.Vehicle; }, function (vehicle) { return vehicle.claims; }), (0, typeorm_1.JoinColumn)({ name: 'vehicleId' })];
        _vehicleId_decorators = [(0, typeorm_1.Column)()];
        _images_decorators = [(0, typeorm_1.OneToMany)(function () { return image_entity_1.Image; }, function (image) { return image.claim; }, { cascade: true })];
        _damageAssessment_decorators = [(0, typeorm_1.OneToOne)(function () { return damage_assessment_entity_1.DamageAssessment; }, function (da) { return da.claim; }, { cascade: true })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        _deletedAt_decorators = [(0, typeorm_1.DeleteDateColumn)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _claimNumber_decorators, { kind: "field", name: "claimNumber", static: false, private: false, access: { has: function (obj) { return "claimNumber" in obj; }, get: function (obj) { return obj.claimNumber; }, set: function (obj, value) { obj.claimNumber = value; } }, metadata: _metadata }, _claimNumber_initializers, _claimNumber_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _accidentDate_decorators, { kind: "field", name: "accidentDate", static: false, private: false, access: { has: function (obj) { return "accidentDate" in obj; }, get: function (obj) { return obj.accidentDate; }, set: function (obj, value) { obj.accidentDate = value; } }, metadata: _metadata }, _accidentDate_initializers, _accidentDate_extraInitializers);
        __esDecorate(null, null, _accidentLocation_decorators, { kind: "field", name: "accidentLocation", static: false, private: false, access: { has: function (obj) { return "accidentLocation" in obj; }, get: function (obj) { return obj.accidentLocation; }, set: function (obj, value) { obj.accidentLocation = value; } }, metadata: _metadata }, _accidentLocation_initializers, _accidentLocation_extraInitializers);
        __esDecorate(null, null, _latitude_decorators, { kind: "field", name: "latitude", static: false, private: false, access: { has: function (obj) { return "latitude" in obj; }, get: function (obj) { return obj.latitude; }, set: function (obj, value) { obj.latitude = value; } }, metadata: _metadata }, _latitude_initializers, _latitude_extraInitializers);
        __esDecorate(null, null, _longitude_decorators, { kind: "field", name: "longitude", static: false, private: false, access: { has: function (obj) { return "longitude" in obj; }, get: function (obj) { return obj.longitude; }, set: function (obj, value) { obj.longitude = value; } }, metadata: _metadata }, _longitude_initializers, _longitude_extraInitializers);
        __esDecorate(null, null, _accidentType_decorators, { kind: "field", name: "accidentType", static: false, private: false, access: { has: function (obj) { return "accidentType" in obj; }, get: function (obj) { return obj.accidentType; }, set: function (obj, value) { obj.accidentType = value; } }, metadata: _metadata }, _accidentType_initializers, _accidentType_extraInitializers);
        __esDecorate(null, null, _severity_decorators, { kind: "field", name: "severity", static: false, private: false, access: { has: function (obj) { return "severity" in obj; }, get: function (obj) { return obj.severity; }, set: function (obj, value) { obj.severity = value; } }, metadata: _metadata }, _severity_initializers, _severity_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _thirdPartyInvolved_decorators, { kind: "field", name: "thirdPartyInvolved", static: false, private: false, access: { has: function (obj) { return "thirdPartyInvolved" in obj; }, get: function (obj) { return obj.thirdPartyInvolved; }, set: function (obj, value) { obj.thirdPartyInvolved = value; } }, metadata: _metadata }, _thirdPartyInvolved_initializers, _thirdPartyInvolved_extraInitializers);
        __esDecorate(null, null, _thirdPartyName_decorators, { kind: "field", name: "thirdPartyName", static: false, private: false, access: { has: function (obj) { return "thirdPartyName" in obj; }, get: function (obj) { return obj.thirdPartyName; }, set: function (obj, value) { obj.thirdPartyName = value; } }, metadata: _metadata }, _thirdPartyName_initializers, _thirdPartyName_extraInitializers);
        __esDecorate(null, null, _thirdPartyLicensePlate_decorators, { kind: "field", name: "thirdPartyLicensePlate", static: false, private: false, access: { has: function (obj) { return "thirdPartyLicensePlate" in obj; }, get: function (obj) { return obj.thirdPartyLicensePlate; }, set: function (obj, value) { obj.thirdPartyLicensePlate = value; } }, metadata: _metadata }, _thirdPartyLicensePlate_initializers, _thirdPartyLicensePlate_extraInitializers);
        __esDecorate(null, null, _thirdPartyInsurance_decorators, { kind: "field", name: "thirdPartyInsurance", static: false, private: false, access: { has: function (obj) { return "thirdPartyInsurance" in obj; }, get: function (obj) { return obj.thirdPartyInsurance; }, set: function (obj, value) { obj.thirdPartyInsurance = value; } }, metadata: _metadata }, _thirdPartyInsurance_initializers, _thirdPartyInsurance_extraInitializers);
        __esDecorate(null, null, _thirdPartyPolicyNumber_decorators, { kind: "field", name: "thirdPartyPolicyNumber", static: false, private: false, access: { has: function (obj) { return "thirdPartyPolicyNumber" in obj; }, get: function (obj) { return obj.thirdPartyPolicyNumber; }, set: function (obj, value) { obj.thirdPartyPolicyNumber = value; } }, metadata: _metadata }, _thirdPartyPolicyNumber_initializers, _thirdPartyPolicyNumber_extraInitializers);
        __esDecorate(null, null, _policeReportFiled_decorators, { kind: "field", name: "policeReportFiled", static: false, private: false, access: { has: function (obj) { return "policeReportFiled" in obj; }, get: function (obj) { return obj.policeReportFiled; }, set: function (obj, value) { obj.policeReportFiled = value; } }, metadata: _metadata }, _policeReportFiled_initializers, _policeReportFiled_extraInitializers);
        __esDecorate(null, null, _policeReportNumber_decorators, { kind: "field", name: "policeReportNumber", static: false, private: false, access: { has: function (obj) { return "policeReportNumber" in obj; }, get: function (obj) { return obj.policeReportNumber; }, set: function (obj, value) { obj.policeReportNumber = value; } }, metadata: _metadata }, _policeReportNumber_initializers, _policeReportNumber_extraInitializers);
        __esDecorate(null, null, _estimatedRepairCost_decorators, { kind: "field", name: "estimatedRepairCost", static: false, private: false, access: { has: function (obj) { return "estimatedRepairCost" in obj; }, get: function (obj) { return obj.estimatedRepairCost; }, set: function (obj, value) { obj.estimatedRepairCost = value; } }, metadata: _metadata }, _estimatedRepairCost_initializers, _estimatedRepairCost_extraInitializers);
        __esDecorate(null, null, _approvedAmount_decorators, { kind: "field", name: "approvedAmount", static: false, private: false, access: { has: function (obj) { return "approvedAmount" in obj; }, get: function (obj) { return obj.approvedAmount; }, set: function (obj, value) { obj.approvedAmount = value; } }, metadata: _metadata }, _approvedAmount_initializers, _approvedAmount_extraInitializers);
        __esDecorate(null, null, _deductibleAmount_decorators, { kind: "field", name: "deductibleAmount", static: false, private: false, access: { has: function (obj) { return "deductibleAmount" in obj; }, get: function (obj) { return obj.deductibleAmount; }, set: function (obj, value) { obj.deductibleAmount = value; } }, metadata: _metadata }, _deductibleAmount_initializers, _deductibleAmount_extraInitializers);
        __esDecorate(null, null, _reviewedById_decorators, { kind: "field", name: "reviewedById", static: false, private: false, access: { has: function (obj) { return "reviewedById" in obj; }, get: function (obj) { return obj.reviewedById; }, set: function (obj, value) { obj.reviewedById = value; } }, metadata: _metadata }, _reviewedById_initializers, _reviewedById_extraInitializers);
        __esDecorate(null, null, _reviewedBy_decorators, { kind: "field", name: "reviewedBy", static: false, private: false, access: { has: function (obj) { return "reviewedBy" in obj; }, get: function (obj) { return obj.reviewedBy; }, set: function (obj, value) { obj.reviewedBy = value; } }, metadata: _metadata }, _reviewedBy_initializers, _reviewedBy_extraInitializers);
        __esDecorate(null, null, _reviewedAt_decorators, { kind: "field", name: "reviewedAt", static: false, private: false, access: { has: function (obj) { return "reviewedAt" in obj; }, get: function (obj) { return obj.reviewedAt; }, set: function (obj, value) { obj.reviewedAt = value; } }, metadata: _metadata }, _reviewedAt_initializers, _reviewedAt_extraInitializers);
        __esDecorate(null, null, _reviewNotes_decorators, { kind: "field", name: "reviewNotes", static: false, private: false, access: { has: function (obj) { return "reviewNotes" in obj; }, get: function (obj) { return obj.reviewNotes; }, set: function (obj, value) { obj.reviewNotes = value; } }, metadata: _metadata }, _reviewNotes_initializers, _reviewNotes_extraInitializers);
        __esDecorate(null, null, _rejectionReason_decorators, { kind: "field", name: "rejectionReason", static: false, private: false, access: { has: function (obj) { return "rejectionReason" in obj; }, get: function (obj) { return obj.rejectionReason; }, set: function (obj, value) { obj.rejectionReason = value; } }, metadata: _metadata }, _rejectionReason_initializers, _rejectionReason_extraInitializers);
        __esDecorate(null, null, _submittedBy_decorators, { kind: "field", name: "submittedBy", static: false, private: false, access: { has: function (obj) { return "submittedBy" in obj; }, get: function (obj) { return obj.submittedBy; }, set: function (obj, value) { obj.submittedBy = value; } }, metadata: _metadata }, _submittedBy_initializers, _submittedBy_extraInitializers);
        __esDecorate(null, null, _submittedById_decorators, { kind: "field", name: "submittedById", static: false, private: false, access: { has: function (obj) { return "submittedById" in obj; }, get: function (obj) { return obj.submittedById; }, set: function (obj, value) { obj.submittedById = value; } }, metadata: _metadata }, _submittedById_initializers, _submittedById_extraInitializers);
        __esDecorate(null, null, _vehicle_decorators, { kind: "field", name: "vehicle", static: false, private: false, access: { has: function (obj) { return "vehicle" in obj; }, get: function (obj) { return obj.vehicle; }, set: function (obj, value) { obj.vehicle = value; } }, metadata: _metadata }, _vehicle_initializers, _vehicle_extraInitializers);
        __esDecorate(null, null, _vehicleId_decorators, { kind: "field", name: "vehicleId", static: false, private: false, access: { has: function (obj) { return "vehicleId" in obj; }, get: function (obj) { return obj.vehicleId; }, set: function (obj, value) { obj.vehicleId = value; } }, metadata: _metadata }, _vehicleId_initializers, _vehicleId_extraInitializers);
        __esDecorate(null, null, _images_decorators, { kind: "field", name: "images", static: false, private: false, access: { has: function (obj) { return "images" in obj; }, get: function (obj) { return obj.images; }, set: function (obj, value) { obj.images = value; } }, metadata: _metadata }, _images_initializers, _images_extraInitializers);
        __esDecorate(null, null, _damageAssessment_decorators, { kind: "field", name: "damageAssessment", static: false, private: false, access: { has: function (obj) { return "damageAssessment" in obj; }, get: function (obj) { return obj.damageAssessment; }, set: function (obj, value) { obj.damageAssessment = value; } }, metadata: _metadata }, _damageAssessment_initializers, _damageAssessment_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: function (obj) { return "updatedAt" in obj; }, get: function (obj) { return obj.updatedAt; }, set: function (obj, value) { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, null, _deletedAt_decorators, { kind: "field", name: "deletedAt", static: false, private: false, access: { has: function (obj) { return "deletedAt" in obj; }, get: function (obj) { return obj.deletedAt; }, set: function (obj, value) { obj.deletedAt = value; } }, metadata: _metadata }, _deletedAt_initializers, _deletedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Claim = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Claim = _classThis;
}();
exports.Claim = Claim;

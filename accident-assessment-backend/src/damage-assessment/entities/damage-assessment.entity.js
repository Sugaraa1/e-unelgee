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
exports.DamageAssessment = exports.AssessmentSource = exports.AssessmentStatus = void 0;
var typeorm_1 = require("typeorm");
var claim_entity_1 = require("../../claims/entities/claim.entity");
var user_entity_1 = require("../../users/entities/user.entity");
var AssessmentStatus;
(function (AssessmentStatus) {
    AssessmentStatus["PENDING"] = "pending";
    AssessmentStatus["AI_COMPLETE"] = "ai_complete";
    AssessmentStatus["HUMAN_REVIEWED"] = "human_reviewed";
    AssessmentStatus["FINALIZED"] = "finalized";
    AssessmentStatus["DISPUTED"] = "disputed";
})(AssessmentStatus || (exports.AssessmentStatus = AssessmentStatus = {}));
var AssessmentSource;
(function (AssessmentSource) {
    AssessmentSource["AI_ONLY"] = "ai_only";
    AssessmentSource["HUMAN_ONLY"] = "human_only";
    AssessmentSource["AI_HUMAN_COMBINED"] = "ai_human_combined";
})(AssessmentSource || (exports.AssessmentSource = AssessmentSource = {}));
var DamageAssessment = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('damage_assessments')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _source_decorators;
    var _source_initializers = [];
    var _source_extraInitializers = [];
    var _damagedParts_decorators;
    var _damagedParts_initializers = [];
    var _damagedParts_extraInitializers = [];
    var _aiEstimatedTotalCost_decorators;
    var _aiEstimatedTotalCost_initializers = [];
    var _aiEstimatedTotalCost_extraInitializers = [];
    var _aiOverallConfidence_decorators;
    var _aiOverallConfidence_initializers = [];
    var _aiOverallConfidence_extraInitializers = [];
    var _aiRawResponse_decorators;
    var _aiRawResponse_initializers = [];
    var _aiRawResponse_extraInitializers = [];
    var _aiSummary_decorators;
    var _aiSummary_initializers = [];
    var _aiSummary_extraInitializers = [];
    var _aiProcessedAt_decorators;
    var _aiProcessedAt_initializers = [];
    var _aiProcessedAt_extraInitializers = [];
    var _aiRetryCount_decorators;
    var _aiRetryCount_initializers = [];
    var _aiRetryCount_extraInitializers = [];
    var _aiErrorMessage_decorators;
    var _aiErrorMessage_initializers = [];
    var _aiErrorMessage_extraInitializers = [];
    var _estimatedPartsCost_decorators;
    var _estimatedPartsCost_initializers = [];
    var _estimatedPartsCost_extraInitializers = [];
    var _estimatedLaborCost_decorators;
    var _estimatedLaborCost_initializers = [];
    var _estimatedLaborCost_extraInitializers = [];
    var _estimatedPaintCost_decorators;
    var _estimatedPaintCost_initializers = [];
    var _estimatedPaintCost_extraInitializers = [];
    var _totalEstimatedCost_decorators;
    var _totalEstimatedCost_initializers = [];
    var _totalEstimatedCost_extraInitializers = [];
    var _isTotalLoss_decorators;
    var _isTotalLoss_initializers = [];
    var _isTotalLoss_extraInitializers = [];
    var _vehicleMarketValue_decorators;
    var _vehicleMarketValue_initializers = [];
    var _vehicleMarketValue_extraInitializers = [];
    var _reviewedById_decorators;
    var _reviewedById_initializers = [];
    var _reviewedById_extraInitializers = [];
    var _reviewedBy_decorators;
    var _reviewedBy_initializers = [];
    var _reviewedBy_extraInitializers = [];
    var _reviewedAt_decorators;
    var _reviewedAt_initializers = [];
    var _reviewedAt_extraInitializers = [];
    var _humanAdjustedCost_decorators;
    var _humanAdjustedCost_initializers = [];
    var _humanAdjustedCost_extraInitializers = [];
    var _humanReviewNotes_decorators;
    var _humanReviewNotes_initializers = [];
    var _humanReviewNotes_extraInitializers = [];
    var _humanAdjustedParts_decorators;
    var _humanAdjustedParts_initializers = [];
    var _humanAdjustedParts_extraInitializers = [];
    var _finalApprovedCost_decorators;
    var _finalApprovedCost_initializers = [];
    var _finalApprovedCost_extraInitializers = [];
    var _finalNotes_decorators;
    var _finalNotes_initializers = [];
    var _finalNotes_extraInitializers = [];
    var _claim_decorators;
    var _claim_initializers = [];
    var _claim_extraInitializers = [];
    var _claimId_decorators;
    var _claimId_initializers = [];
    var _claimId_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var _updatedAt_decorators;
    var _updatedAt_initializers = [];
    var _updatedAt_extraInitializers = [];
    var DamageAssessment = _classThis = /** @class */ (function () {
        function DamageAssessment_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            // ── Status ────────────────────────────────────────────────────
            this.status = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _status_initializers, void 0));
            this.source = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _source_initializers, void 0));
            // ── AI Assessment ─────────────────────────────────────────────
            this.damagedParts = (__runInitializers(this, _source_extraInitializers), __runInitializers(this, _damagedParts_initializers, void 0));
            this.aiEstimatedTotalCost = (__runInitializers(this, _damagedParts_extraInitializers), __runInitializers(this, _aiEstimatedTotalCost_initializers, void 0));
            this.aiOverallConfidence = (__runInitializers(this, _aiEstimatedTotalCost_extraInitializers), __runInitializers(this, _aiOverallConfidence_initializers, void 0)); // 0.0000 – 1.0000
            this.aiRawResponse = (__runInitializers(this, _aiOverallConfidence_extraInitializers), __runInitializers(this, _aiRawResponse_initializers, void 0));
            this.aiSummary = (__runInitializers(this, _aiRawResponse_extraInitializers), __runInitializers(this, _aiSummary_initializers, void 0)); // AI-generated human-readable summary
            this.aiProcessedAt = (__runInitializers(this, _aiSummary_extraInitializers), __runInitializers(this, _aiProcessedAt_initializers, void 0));
            this.aiRetryCount = (__runInitializers(this, _aiProcessedAt_extraInitializers), __runInitializers(this, _aiRetryCount_initializers, void 0));
            this.aiErrorMessage = (__runInitializers(this, _aiRetryCount_extraInitializers), __runInitializers(this, _aiErrorMessage_initializers, void 0));
            // ── Repair Breakdown ──────────────────────────────────────────
            this.estimatedPartsCost = (__runInitializers(this, _aiErrorMessage_extraInitializers), __runInitializers(this, _estimatedPartsCost_initializers, void 0));
            this.estimatedLaborCost = (__runInitializers(this, _estimatedPartsCost_extraInitializers), __runInitializers(this, _estimatedLaborCost_initializers, void 0));
            this.estimatedPaintCost = (__runInitializers(this, _estimatedLaborCost_extraInitializers), __runInitializers(this, _estimatedPaintCost_initializers, void 0));
            this.totalEstimatedCost = (__runInitializers(this, _estimatedPaintCost_extraInitializers), __runInitializers(this, _totalEstimatedCost_initializers, void 0)); // sum of all above
            this.isTotalLoss = (__runInitializers(this, _totalEstimatedCost_extraInitializers), __runInitializers(this, _isTotalLoss_initializers, void 0));
            this.vehicleMarketValue = (__runInitializers(this, _isTotalLoss_extraInitializers), __runInitializers(this, _vehicleMarketValue_initializers, void 0)); // for total-loss calculation
            // ── Human Review ──────────────────────────────────────────────
            this.reviewedById = (__runInitializers(this, _vehicleMarketValue_extraInitializers), __runInitializers(this, _reviewedById_initializers, void 0));
            this.reviewedBy = (__runInitializers(this, _reviewedById_extraInitializers), __runInitializers(this, _reviewedBy_initializers, void 0));
            this.reviewedAt = (__runInitializers(this, _reviewedBy_extraInitializers), __runInitializers(this, _reviewedAt_initializers, void 0));
            this.humanAdjustedCost = (__runInitializers(this, _reviewedAt_extraInitializers), __runInitializers(this, _humanAdjustedCost_initializers, void 0)); // adjuster's final figure (overrides AI)
            this.humanReviewNotes = (__runInitializers(this, _humanAdjustedCost_extraInitializers), __runInitializers(this, _humanReviewNotes_initializers, void 0));
            this.humanAdjustedParts = (__runInitializers(this, _humanReviewNotes_extraInitializers), __runInitializers(this, _humanAdjustedParts_initializers, void 0)); // adjuster can add/remove/edit parts
            // ── Final Figures ─────────────────────────────────────────────
            this.finalApprovedCost = (__runInitializers(this, _humanAdjustedParts_extraInitializers), __runInitializers(this, _finalApprovedCost_initializers, void 0));
            this.finalNotes = (__runInitializers(this, _finalApprovedCost_extraInitializers), __runInitializers(this, _finalNotes_initializers, void 0));
            // ── Relation ──────────────────────────────────────────────────
            this.claim = (__runInitializers(this, _finalNotes_extraInitializers), __runInitializers(this, _claim_initializers, void 0));
            this.claimId = (__runInitializers(this, _claim_extraInitializers), __runInitializers(this, _claimId_initializers, void 0));
            // ── Timestamps ────────────────────────────────────────────────
            this.createdAt = (__runInitializers(this, _claimId_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            __runInitializers(this, _updatedAt_extraInitializers);
        }
        Object.defineProperty(DamageAssessment_1.prototype, "effectiveCost", {
            // ── Helper ────────────────────────────────────────────────────
            get: function () {
                var _a, _b, _c;
                return ((_c = (_b = (_a = this.finalApprovedCost) !== null && _a !== void 0 ? _a : this.humanAdjustedCost) !== null && _b !== void 0 ? _b : this.totalEstimatedCost) !== null && _c !== void 0 ? _c : 0);
            },
            enumerable: false,
            configurable: true
        });
        return DamageAssessment_1;
    }());
    __setFunctionName(_classThis, "DamageAssessment");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _status_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: AssessmentStatus,
                default: AssessmentStatus.PENDING,
            })];
        _source_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: AssessmentSource,
                default: AssessmentSource.AI_ONLY,
            })];
        _damagedParts_decorators = [(0, typeorm_1.Column)({ type: 'jsonb', nullable: true })];
        _aiEstimatedTotalCost_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true })];
        _aiOverallConfidence_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 4, nullable: true })];
        _aiRawResponse_decorators = [(0, typeorm_1.Column)({ type: 'jsonb', nullable: true })];
        _aiSummary_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _aiProcessedAt_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _aiRetryCount_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 0 })];
        _aiErrorMessage_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _estimatedPartsCost_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true })];
        _estimatedLaborCost_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true })];
        _estimatedPaintCost_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true })];
        _totalEstimatedCost_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true })];
        _isTotalLoss_decorators = [(0, typeorm_1.Column)({ default: false })];
        _vehicleMarketValue_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true })];
        _reviewedById_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _reviewedBy_decorators = [(0, typeorm_1.ManyToOne)(function () { return user_entity_1.User; }, { nullable: true }), (0, typeorm_1.JoinColumn)({ name: 'reviewedById' })];
        _reviewedAt_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _humanAdjustedCost_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true })];
        _humanReviewNotes_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _humanAdjustedParts_decorators = [(0, typeorm_1.Column)({ type: 'jsonb', nullable: true })];
        _finalApprovedCost_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true })];
        _finalNotes_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _claim_decorators = [(0, typeorm_1.OneToOne)(function () { return claim_entity_1.Claim; }, function (claim) { return claim.damageAssessment; }, {
                onDelete: 'CASCADE',
            }), (0, typeorm_1.JoinColumn)({ name: 'claimId' })];
        _claimId_decorators = [(0, typeorm_1.Column)()];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _source_decorators, { kind: "field", name: "source", static: false, private: false, access: { has: function (obj) { return "source" in obj; }, get: function (obj) { return obj.source; }, set: function (obj, value) { obj.source = value; } }, metadata: _metadata }, _source_initializers, _source_extraInitializers);
        __esDecorate(null, null, _damagedParts_decorators, { kind: "field", name: "damagedParts", static: false, private: false, access: { has: function (obj) { return "damagedParts" in obj; }, get: function (obj) { return obj.damagedParts; }, set: function (obj, value) { obj.damagedParts = value; } }, metadata: _metadata }, _damagedParts_initializers, _damagedParts_extraInitializers);
        __esDecorate(null, null, _aiEstimatedTotalCost_decorators, { kind: "field", name: "aiEstimatedTotalCost", static: false, private: false, access: { has: function (obj) { return "aiEstimatedTotalCost" in obj; }, get: function (obj) { return obj.aiEstimatedTotalCost; }, set: function (obj, value) { obj.aiEstimatedTotalCost = value; } }, metadata: _metadata }, _aiEstimatedTotalCost_initializers, _aiEstimatedTotalCost_extraInitializers);
        __esDecorate(null, null, _aiOverallConfidence_decorators, { kind: "field", name: "aiOverallConfidence", static: false, private: false, access: { has: function (obj) { return "aiOverallConfidence" in obj; }, get: function (obj) { return obj.aiOverallConfidence; }, set: function (obj, value) { obj.aiOverallConfidence = value; } }, metadata: _metadata }, _aiOverallConfidence_initializers, _aiOverallConfidence_extraInitializers);
        __esDecorate(null, null, _aiRawResponse_decorators, { kind: "field", name: "aiRawResponse", static: false, private: false, access: { has: function (obj) { return "aiRawResponse" in obj; }, get: function (obj) { return obj.aiRawResponse; }, set: function (obj, value) { obj.aiRawResponse = value; } }, metadata: _metadata }, _aiRawResponse_initializers, _aiRawResponse_extraInitializers);
        __esDecorate(null, null, _aiSummary_decorators, { kind: "field", name: "aiSummary", static: false, private: false, access: { has: function (obj) { return "aiSummary" in obj; }, get: function (obj) { return obj.aiSummary; }, set: function (obj, value) { obj.aiSummary = value; } }, metadata: _metadata }, _aiSummary_initializers, _aiSummary_extraInitializers);
        __esDecorate(null, null, _aiProcessedAt_decorators, { kind: "field", name: "aiProcessedAt", static: false, private: false, access: { has: function (obj) { return "aiProcessedAt" in obj; }, get: function (obj) { return obj.aiProcessedAt; }, set: function (obj, value) { obj.aiProcessedAt = value; } }, metadata: _metadata }, _aiProcessedAt_initializers, _aiProcessedAt_extraInitializers);
        __esDecorate(null, null, _aiRetryCount_decorators, { kind: "field", name: "aiRetryCount", static: false, private: false, access: { has: function (obj) { return "aiRetryCount" in obj; }, get: function (obj) { return obj.aiRetryCount; }, set: function (obj, value) { obj.aiRetryCount = value; } }, metadata: _metadata }, _aiRetryCount_initializers, _aiRetryCount_extraInitializers);
        __esDecorate(null, null, _aiErrorMessage_decorators, { kind: "field", name: "aiErrorMessage", static: false, private: false, access: { has: function (obj) { return "aiErrorMessage" in obj; }, get: function (obj) { return obj.aiErrorMessage; }, set: function (obj, value) { obj.aiErrorMessage = value; } }, metadata: _metadata }, _aiErrorMessage_initializers, _aiErrorMessage_extraInitializers);
        __esDecorate(null, null, _estimatedPartsCost_decorators, { kind: "field", name: "estimatedPartsCost", static: false, private: false, access: { has: function (obj) { return "estimatedPartsCost" in obj; }, get: function (obj) { return obj.estimatedPartsCost; }, set: function (obj, value) { obj.estimatedPartsCost = value; } }, metadata: _metadata }, _estimatedPartsCost_initializers, _estimatedPartsCost_extraInitializers);
        __esDecorate(null, null, _estimatedLaborCost_decorators, { kind: "field", name: "estimatedLaborCost", static: false, private: false, access: { has: function (obj) { return "estimatedLaborCost" in obj; }, get: function (obj) { return obj.estimatedLaborCost; }, set: function (obj, value) { obj.estimatedLaborCost = value; } }, metadata: _metadata }, _estimatedLaborCost_initializers, _estimatedLaborCost_extraInitializers);
        __esDecorate(null, null, _estimatedPaintCost_decorators, { kind: "field", name: "estimatedPaintCost", static: false, private: false, access: { has: function (obj) { return "estimatedPaintCost" in obj; }, get: function (obj) { return obj.estimatedPaintCost; }, set: function (obj, value) { obj.estimatedPaintCost = value; } }, metadata: _metadata }, _estimatedPaintCost_initializers, _estimatedPaintCost_extraInitializers);
        __esDecorate(null, null, _totalEstimatedCost_decorators, { kind: "field", name: "totalEstimatedCost", static: false, private: false, access: { has: function (obj) { return "totalEstimatedCost" in obj; }, get: function (obj) { return obj.totalEstimatedCost; }, set: function (obj, value) { obj.totalEstimatedCost = value; } }, metadata: _metadata }, _totalEstimatedCost_initializers, _totalEstimatedCost_extraInitializers);
        __esDecorate(null, null, _isTotalLoss_decorators, { kind: "field", name: "isTotalLoss", static: false, private: false, access: { has: function (obj) { return "isTotalLoss" in obj; }, get: function (obj) { return obj.isTotalLoss; }, set: function (obj, value) { obj.isTotalLoss = value; } }, metadata: _metadata }, _isTotalLoss_initializers, _isTotalLoss_extraInitializers);
        __esDecorate(null, null, _vehicleMarketValue_decorators, { kind: "field", name: "vehicleMarketValue", static: false, private: false, access: { has: function (obj) { return "vehicleMarketValue" in obj; }, get: function (obj) { return obj.vehicleMarketValue; }, set: function (obj, value) { obj.vehicleMarketValue = value; } }, metadata: _metadata }, _vehicleMarketValue_initializers, _vehicleMarketValue_extraInitializers);
        __esDecorate(null, null, _reviewedById_decorators, { kind: "field", name: "reviewedById", static: false, private: false, access: { has: function (obj) { return "reviewedById" in obj; }, get: function (obj) { return obj.reviewedById; }, set: function (obj, value) { obj.reviewedById = value; } }, metadata: _metadata }, _reviewedById_initializers, _reviewedById_extraInitializers);
        __esDecorate(null, null, _reviewedBy_decorators, { kind: "field", name: "reviewedBy", static: false, private: false, access: { has: function (obj) { return "reviewedBy" in obj; }, get: function (obj) { return obj.reviewedBy; }, set: function (obj, value) { obj.reviewedBy = value; } }, metadata: _metadata }, _reviewedBy_initializers, _reviewedBy_extraInitializers);
        __esDecorate(null, null, _reviewedAt_decorators, { kind: "field", name: "reviewedAt", static: false, private: false, access: { has: function (obj) { return "reviewedAt" in obj; }, get: function (obj) { return obj.reviewedAt; }, set: function (obj, value) { obj.reviewedAt = value; } }, metadata: _metadata }, _reviewedAt_initializers, _reviewedAt_extraInitializers);
        __esDecorate(null, null, _humanAdjustedCost_decorators, { kind: "field", name: "humanAdjustedCost", static: false, private: false, access: { has: function (obj) { return "humanAdjustedCost" in obj; }, get: function (obj) { return obj.humanAdjustedCost; }, set: function (obj, value) { obj.humanAdjustedCost = value; } }, metadata: _metadata }, _humanAdjustedCost_initializers, _humanAdjustedCost_extraInitializers);
        __esDecorate(null, null, _humanReviewNotes_decorators, { kind: "field", name: "humanReviewNotes", static: false, private: false, access: { has: function (obj) { return "humanReviewNotes" in obj; }, get: function (obj) { return obj.humanReviewNotes; }, set: function (obj, value) { obj.humanReviewNotes = value; } }, metadata: _metadata }, _humanReviewNotes_initializers, _humanReviewNotes_extraInitializers);
        __esDecorate(null, null, _humanAdjustedParts_decorators, { kind: "field", name: "humanAdjustedParts", static: false, private: false, access: { has: function (obj) { return "humanAdjustedParts" in obj; }, get: function (obj) { return obj.humanAdjustedParts; }, set: function (obj, value) { obj.humanAdjustedParts = value; } }, metadata: _metadata }, _humanAdjustedParts_initializers, _humanAdjustedParts_extraInitializers);
        __esDecorate(null, null, _finalApprovedCost_decorators, { kind: "field", name: "finalApprovedCost", static: false, private: false, access: { has: function (obj) { return "finalApprovedCost" in obj; }, get: function (obj) { return obj.finalApprovedCost; }, set: function (obj, value) { obj.finalApprovedCost = value; } }, metadata: _metadata }, _finalApprovedCost_initializers, _finalApprovedCost_extraInitializers);
        __esDecorate(null, null, _finalNotes_decorators, { kind: "field", name: "finalNotes", static: false, private: false, access: { has: function (obj) { return "finalNotes" in obj; }, get: function (obj) { return obj.finalNotes; }, set: function (obj, value) { obj.finalNotes = value; } }, metadata: _metadata }, _finalNotes_initializers, _finalNotes_extraInitializers);
        __esDecorate(null, null, _claim_decorators, { kind: "field", name: "claim", static: false, private: false, access: { has: function (obj) { return "claim" in obj; }, get: function (obj) { return obj.claim; }, set: function (obj, value) { obj.claim = value; } }, metadata: _metadata }, _claim_initializers, _claim_extraInitializers);
        __esDecorate(null, null, _claimId_decorators, { kind: "field", name: "claimId", static: false, private: false, access: { has: function (obj) { return "claimId" in obj; }, get: function (obj) { return obj.claimId; }, set: function (obj, value) { obj.claimId = value; } }, metadata: _metadata }, _claimId_initializers, _claimId_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: function (obj) { return "updatedAt" in obj; }, get: function (obj) { return obj.updatedAt; }, set: function (obj, value) { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DamageAssessment = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DamageAssessment = _classThis;
}();
exports.DamageAssessment = DamageAssessment;

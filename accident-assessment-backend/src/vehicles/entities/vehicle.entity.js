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
exports.Vehicle = exports.VehicleCondition = exports.FuelType = void 0;
var typeorm_1 = require("typeorm");
var user_entity_1 = require("../../users/entities/user.entity");
var claim_entity_1 = require("../../claims/entities/claim.entity");
var FuelType;
(function (FuelType) {
    FuelType["PETROL"] = "petrol";
    FuelType["DIESEL"] = "diesel";
    FuelType["ELECTRIC"] = "electric";
    FuelType["HYBRID"] = "hybrid";
    FuelType["LPG"] = "lpg";
})(FuelType || (exports.FuelType = FuelType = {}));
var VehicleCondition;
(function (VehicleCondition) {
    VehicleCondition["EXCELLENT"] = "excellent";
    VehicleCondition["GOOD"] = "good";
    VehicleCondition["FAIR"] = "fair";
    VehicleCondition["POOR"] = "poor";
})(VehicleCondition || (exports.VehicleCondition = VehicleCondition = {}));
var Vehicle = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('vehicles')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _make_decorators;
    var _make_initializers = [];
    var _make_extraInitializers = [];
    var _model_decorators;
    var _model_initializers = [];
    var _model_extraInitializers = [];
    var _year_decorators;
    var _year_initializers = [];
    var _year_extraInitializers = [];
    var _color_decorators;
    var _color_initializers = [];
    var _color_extraInitializers = [];
    var _licensePlate_decorators;
    var _licensePlate_initializers = [];
    var _licensePlate_extraInitializers = [];
    var _vin_decorators;
    var _vin_initializers = [];
    var _vin_extraInitializers = [];
    var _fuelType_decorators;
    var _fuelType_initializers = [];
    var _fuelType_extraInitializers = [];
    var _engineSize_decorators;
    var _engineSize_initializers = [];
    var _engineSize_extraInitializers = [];
    var _mileage_decorators;
    var _mileage_initializers = [];
    var _mileage_extraInitializers = [];
    var _estimatedValue_decorators;
    var _estimatedValue_initializers = [];
    var _estimatedValue_extraInitializers = [];
    var _condition_decorators;
    var _condition_initializers = [];
    var _condition_extraInitializers = [];
    var _insuranceProvider_decorators;
    var _insuranceProvider_initializers = [];
    var _insuranceProvider_extraInitializers = [];
    var _insurancePolicyNumber_decorators;
    var _insurancePolicyNumber_initializers = [];
    var _insurancePolicyNumber_extraInitializers = [];
    var _insuranceExpiryDate_decorators;
    var _insuranceExpiryDate_initializers = [];
    var _insuranceExpiryDate_extraInitializers = [];
    var _owner_decorators;
    var _owner_initializers = [];
    var _owner_extraInitializers = [];
    var _ownerId_decorators;
    var _ownerId_initializers = [];
    var _ownerId_extraInitializers = [];
    var _claims_decorators;
    var _claims_initializers = [];
    var _claims_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var _updatedAt_decorators;
    var _updatedAt_initializers = [];
    var _updatedAt_extraInitializers = [];
    var _deletedAt_decorators;
    var _deletedAt_initializers = [];
    var _deletedAt_extraInitializers = [];
    var Vehicle = _classThis = /** @class */ (function () {
        function Vehicle_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            // ── Basic Info ────────────────────────────────────────────────
            this.make = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _make_initializers, void 0)); // Toyota, BMW, etc.
            this.model = (__runInitializers(this, _make_extraInitializers), __runInitializers(this, _model_initializers, void 0));
            this.year = (__runInitializers(this, _model_extraInitializers), __runInitializers(this, _year_initializers, void 0));
            this.color = (__runInitializers(this, _year_extraInitializers), __runInitializers(this, _color_initializers, void 0));
            // ── Identification ────────────────────────────────────────────
            this.licensePlate = (__runInitializers(this, _color_extraInitializers), __runInitializers(this, _licensePlate_initializers, void 0));
            this.vin = (__runInitializers(this, _licensePlate_extraInitializers), __runInitializers(this, _vin_initializers, void 0)); // Vehicle Identification Number (17 chars)
            // ── Technical Details ─────────────────────────────────────────
            this.fuelType = (__runInitializers(this, _vin_extraInitializers), __runInitializers(this, _fuelType_initializers, void 0));
            this.engineSize = (__runInitializers(this, _fuelType_extraInitializers), __runInitializers(this, _engineSize_initializers, void 0));
            this.mileage = (__runInitializers(this, _engineSize_extraInitializers), __runInitializers(this, _mileage_initializers, void 0)); // in km
            this.estimatedValue = (__runInitializers(this, _mileage_extraInitializers), __runInitializers(this, _estimatedValue_initializers, void 0));
            this.condition = (__runInitializers(this, _estimatedValue_extraInitializers), __runInitializers(this, _condition_initializers, void 0));
            // ── Insurance ─────────────────────────────────────────────────
            this.insuranceProvider = (__runInitializers(this, _condition_extraInitializers), __runInitializers(this, _insuranceProvider_initializers, void 0));
            this.insurancePolicyNumber = (__runInitializers(this, _insuranceProvider_extraInitializers), __runInitializers(this, _insurancePolicyNumber_initializers, void 0));
            this.insuranceExpiryDate = (__runInitializers(this, _insurancePolicyNumber_extraInitializers), __runInitializers(this, _insuranceExpiryDate_initializers, void 0));
            // ── Relations ─────────────────────────────────────────────────
            this.owner = (__runInitializers(this, _insuranceExpiryDate_extraInitializers), __runInitializers(this, _owner_initializers, void 0));
            this.ownerId = (__runInitializers(this, _owner_extraInitializers), __runInitializers(this, _ownerId_initializers, void 0));
            this.claims = (__runInitializers(this, _ownerId_extraInitializers), __runInitializers(this, _claims_initializers, void 0));
            // ── Timestamps ────────────────────────────────────────────────
            this.createdAt = (__runInitializers(this, _claims_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            this.deletedAt = (__runInitializers(this, _updatedAt_extraInitializers), __runInitializers(this, _deletedAt_initializers, void 0));
            __runInitializers(this, _deletedAt_extraInitializers);
        }
        return Vehicle_1;
    }());
    __setFunctionName(_classThis, "Vehicle");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _make_decorators = [(0, typeorm_1.Column)({ length: 100 })];
        _model_decorators = [(0, typeorm_1.Column)({ length: 100 })];
        _year_decorators = [(0, typeorm_1.Column)({ type: 'int' })];
        _color_decorators = [(0, typeorm_1.Column)({ length: 20 })];
        _licensePlate_decorators = [(0, typeorm_1.Index)({ unique: true }), (0, typeorm_1.Column)({ length: 20 })];
        _vin_decorators = [(0, typeorm_1.Index)({ unique: true }), (0, typeorm_1.Column)({ length: 17, nullable: true })];
        _fuelType_decorators = [(0, typeorm_1.Column)({ type: 'enum', enum: FuelType, default: FuelType.PETROL })];
        _engineSize_decorators = [(0, typeorm_1.Column)({ nullable: true, length: 50 })];
        _mileage_decorators = [(0, typeorm_1.Column)({ type: 'int', nullable: true })];
        _estimatedValue_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true })];
        _condition_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: VehicleCondition,
                default: VehicleCondition.GOOD,
            })];
        _insuranceProvider_decorators = [(0, typeorm_1.Column)({ nullable: true, length: 100 })];
        _insurancePolicyNumber_decorators = [(0, typeorm_1.Column)({ nullable: true, length: 50 })];
        _insuranceExpiryDate_decorators = [(0, typeorm_1.Column)({ type: 'date', nullable: true })];
        _owner_decorators = [(0, typeorm_1.ManyToOne)(function () { return user_entity_1.User; }, function (user) { return user.vehicles; }, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'ownerId' })];
        _ownerId_decorators = [(0, typeorm_1.Column)()];
        _claims_decorators = [(0, typeorm_1.OneToMany)(function () { return claim_entity_1.Claim; }, function (claim) { return claim.vehicle; })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        _deletedAt_decorators = [(0, typeorm_1.DeleteDateColumn)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _make_decorators, { kind: "field", name: "make", static: false, private: false, access: { has: function (obj) { return "make" in obj; }, get: function (obj) { return obj.make; }, set: function (obj, value) { obj.make = value; } }, metadata: _metadata }, _make_initializers, _make_extraInitializers);
        __esDecorate(null, null, _model_decorators, { kind: "field", name: "model", static: false, private: false, access: { has: function (obj) { return "model" in obj; }, get: function (obj) { return obj.model; }, set: function (obj, value) { obj.model = value; } }, metadata: _metadata }, _model_initializers, _model_extraInitializers);
        __esDecorate(null, null, _year_decorators, { kind: "field", name: "year", static: false, private: false, access: { has: function (obj) { return "year" in obj; }, get: function (obj) { return obj.year; }, set: function (obj, value) { obj.year = value; } }, metadata: _metadata }, _year_initializers, _year_extraInitializers);
        __esDecorate(null, null, _color_decorators, { kind: "field", name: "color", static: false, private: false, access: { has: function (obj) { return "color" in obj; }, get: function (obj) { return obj.color; }, set: function (obj, value) { obj.color = value; } }, metadata: _metadata }, _color_initializers, _color_extraInitializers);
        __esDecorate(null, null, _licensePlate_decorators, { kind: "field", name: "licensePlate", static: false, private: false, access: { has: function (obj) { return "licensePlate" in obj; }, get: function (obj) { return obj.licensePlate; }, set: function (obj, value) { obj.licensePlate = value; } }, metadata: _metadata }, _licensePlate_initializers, _licensePlate_extraInitializers);
        __esDecorate(null, null, _vin_decorators, { kind: "field", name: "vin", static: false, private: false, access: { has: function (obj) { return "vin" in obj; }, get: function (obj) { return obj.vin; }, set: function (obj, value) { obj.vin = value; } }, metadata: _metadata }, _vin_initializers, _vin_extraInitializers);
        __esDecorate(null, null, _fuelType_decorators, { kind: "field", name: "fuelType", static: false, private: false, access: { has: function (obj) { return "fuelType" in obj; }, get: function (obj) { return obj.fuelType; }, set: function (obj, value) { obj.fuelType = value; } }, metadata: _metadata }, _fuelType_initializers, _fuelType_extraInitializers);
        __esDecorate(null, null, _engineSize_decorators, { kind: "field", name: "engineSize", static: false, private: false, access: { has: function (obj) { return "engineSize" in obj; }, get: function (obj) { return obj.engineSize; }, set: function (obj, value) { obj.engineSize = value; } }, metadata: _metadata }, _engineSize_initializers, _engineSize_extraInitializers);
        __esDecorate(null, null, _mileage_decorators, { kind: "field", name: "mileage", static: false, private: false, access: { has: function (obj) { return "mileage" in obj; }, get: function (obj) { return obj.mileage; }, set: function (obj, value) { obj.mileage = value; } }, metadata: _metadata }, _mileage_initializers, _mileage_extraInitializers);
        __esDecorate(null, null, _estimatedValue_decorators, { kind: "field", name: "estimatedValue", static: false, private: false, access: { has: function (obj) { return "estimatedValue" in obj; }, get: function (obj) { return obj.estimatedValue; }, set: function (obj, value) { obj.estimatedValue = value; } }, metadata: _metadata }, _estimatedValue_initializers, _estimatedValue_extraInitializers);
        __esDecorate(null, null, _condition_decorators, { kind: "field", name: "condition", static: false, private: false, access: { has: function (obj) { return "condition" in obj; }, get: function (obj) { return obj.condition; }, set: function (obj, value) { obj.condition = value; } }, metadata: _metadata }, _condition_initializers, _condition_extraInitializers);
        __esDecorate(null, null, _insuranceProvider_decorators, { kind: "field", name: "insuranceProvider", static: false, private: false, access: { has: function (obj) { return "insuranceProvider" in obj; }, get: function (obj) { return obj.insuranceProvider; }, set: function (obj, value) { obj.insuranceProvider = value; } }, metadata: _metadata }, _insuranceProvider_initializers, _insuranceProvider_extraInitializers);
        __esDecorate(null, null, _insurancePolicyNumber_decorators, { kind: "field", name: "insurancePolicyNumber", static: false, private: false, access: { has: function (obj) { return "insurancePolicyNumber" in obj; }, get: function (obj) { return obj.insurancePolicyNumber; }, set: function (obj, value) { obj.insurancePolicyNumber = value; } }, metadata: _metadata }, _insurancePolicyNumber_initializers, _insurancePolicyNumber_extraInitializers);
        __esDecorate(null, null, _insuranceExpiryDate_decorators, { kind: "field", name: "insuranceExpiryDate", static: false, private: false, access: { has: function (obj) { return "insuranceExpiryDate" in obj; }, get: function (obj) { return obj.insuranceExpiryDate; }, set: function (obj, value) { obj.insuranceExpiryDate = value; } }, metadata: _metadata }, _insuranceExpiryDate_initializers, _insuranceExpiryDate_extraInitializers);
        __esDecorate(null, null, _owner_decorators, { kind: "field", name: "owner", static: false, private: false, access: { has: function (obj) { return "owner" in obj; }, get: function (obj) { return obj.owner; }, set: function (obj, value) { obj.owner = value; } }, metadata: _metadata }, _owner_initializers, _owner_extraInitializers);
        __esDecorate(null, null, _ownerId_decorators, { kind: "field", name: "ownerId", static: false, private: false, access: { has: function (obj) { return "ownerId" in obj; }, get: function (obj) { return obj.ownerId; }, set: function (obj, value) { obj.ownerId = value; } }, metadata: _metadata }, _ownerId_initializers, _ownerId_extraInitializers);
        __esDecorate(null, null, _claims_decorators, { kind: "field", name: "claims", static: false, private: false, access: { has: function (obj) { return "claims" in obj; }, get: function (obj) { return obj.claims; }, set: function (obj, value) { obj.claims = value; } }, metadata: _metadata }, _claims_initializers, _claims_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: function (obj) { return "updatedAt" in obj; }, get: function (obj) { return obj.updatedAt; }, set: function (obj, value) { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, null, _deletedAt_decorators, { kind: "field", name: "deletedAt", static: false, private: false, access: { has: function (obj) { return "deletedAt" in obj; }, get: function (obj) { return obj.deletedAt; }, set: function (obj, value) { obj.deletedAt = value; } }, metadata: _metadata }, _deletedAt_initializers, _deletedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Vehicle = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Vehicle = _classThis;
}();
exports.Vehicle = Vehicle;

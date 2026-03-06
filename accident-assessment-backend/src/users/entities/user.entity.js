"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserStatus = exports.UserRole = void 0;
var typeorm_1 = require("typeorm");
var class_transformer_1 = require("class-transformer");
var bcrypt = require("bcrypt");
var vehicle_entity_1 = require("../../vehicles/entities/vehicle.entity");
var claim_entity_1 = require("../../claims/entities/claim.entity");
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["ADJUSTER"] = "adjuster";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INACTIVE"] = "inactive";
    UserStatus["SUSPENDED"] = "suspended";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var User = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('users')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _firstName_decorators;
    var _firstName_initializers = [];
    var _firstName_extraInitializers = [];
    var _lastName_decorators;
    var _lastName_initializers = [];
    var _lastName_extraInitializers = [];
    var _email_decorators;
    var _email_initializers = [];
    var _email_extraInitializers = [];
    var _phoneNumber_decorators;
    var _phoneNumber_initializers = [];
    var _phoneNumber_extraInitializers = [];
    var _password_decorators;
    var _password_initializers = [];
    var _password_extraInitializers = [];
    var _role_decorators;
    var _role_initializers = [];
    var _role_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _refreshToken_decorators;
    var _refreshToken_initializers = [];
    var _refreshToken_extraInitializers = [];
    var _isEmailVerified_decorators;
    var _isEmailVerified_initializers = [];
    var _isEmailVerified_extraInitializers = [];
    var _emailVerificationToken_decorators;
    var _emailVerificationToken_initializers = [];
    var _emailVerificationToken_extraInitializers = [];
    var _passwordResetToken_decorators;
    var _passwordResetToken_initializers = [];
    var _passwordResetToken_extraInitializers = [];
    var _passwordResetExpires_decorators;
    var _passwordResetExpires_initializers = [];
    var _passwordResetExpires_extraInitializers = [];
    var _avatarUrl_decorators;
    var _avatarUrl_initializers = [];
    var _avatarUrl_extraInitializers = [];
    var _insurancePolicyNumber_decorators;
    var _insurancePolicyNumber_initializers = [];
    var _insurancePolicyNumber_extraInitializers = [];
    var _insuranceProvider_decorators;
    var _insuranceProvider_initializers = [];
    var _insuranceProvider_extraInitializers = [];
    var _vehicles_decorators;
    var _vehicles_initializers = [];
    var _vehicles_extraInitializers = [];
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
    var _hashPassword_decorators;
    var User = _classThis = /** @class */ (function () {
        function User_1() {
            this.id = (__runInitializers(this, _instanceExtraInitializers), __runInitializers(this, _id_initializers, void 0));
            // ── Personal Info ─────────────────────────────────────────────
            this.firstName = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _firstName_initializers, void 0));
            this.lastName = (__runInitializers(this, _firstName_extraInitializers), __runInitializers(this, _lastName_initializers, void 0));
            this.email = (__runInitializers(this, _lastName_extraInitializers), __runInitializers(this, _email_initializers, void 0));
            this.phoneNumber = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _phoneNumber_initializers, void 0));
            // ── Auth ──────────────────────────────────────────────────────
            this.password = (__runInitializers(this, _phoneNumber_extraInitializers), __runInitializers(this, _password_initializers, void 0));
            this.role = (__runInitializers(this, _password_extraInitializers), __runInitializers(this, _role_initializers, void 0));
            this.status = (__runInitializers(this, _role_extraInitializers), __runInitializers(this, _status_initializers, void 0));
            this.refreshToken = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _refreshToken_initializers, void 0));
            this.isEmailVerified = (__runInitializers(this, _refreshToken_extraInitializers), __runInitializers(this, _isEmailVerified_initializers, void 0));
            this.emailVerificationToken = (__runInitializers(this, _isEmailVerified_extraInitializers), __runInitializers(this, _emailVerificationToken_initializers, void 0));
            this.passwordResetToken = (__runInitializers(this, _emailVerificationToken_extraInitializers), __runInitializers(this, _passwordResetToken_initializers, void 0));
            this.passwordResetExpires = (__runInitializers(this, _passwordResetToken_extraInitializers), __runInitializers(this, _passwordResetExpires_initializers, void 0));
            this.avatarUrl = (__runInitializers(this, _passwordResetExpires_extraInitializers), __runInitializers(this, _avatarUrl_initializers, void 0));
            // ── Insurance Info ────────────────────────────────────────────
            this.insurancePolicyNumber = (__runInitializers(this, _avatarUrl_extraInitializers), __runInitializers(this, _insurancePolicyNumber_initializers, void 0));
            this.insuranceProvider = (__runInitializers(this, _insurancePolicyNumber_extraInitializers), __runInitializers(this, _insuranceProvider_initializers, void 0));
            // ── Relations ─────────────────────────────────────────────────
            this.vehicles = (__runInitializers(this, _insuranceProvider_extraInitializers), __runInitializers(this, _vehicles_initializers, void 0));
            this.claims = (__runInitializers(this, _vehicles_extraInitializers), __runInitializers(this, _claims_initializers, void 0));
            // ── Timestamps ────────────────────────────────────────────────
            this.createdAt = (__runInitializers(this, _claims_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            this.deletedAt = (__runInitializers(this, _updatedAt_extraInitializers), __runInitializers(this, _deletedAt_initializers, void 0));
            __runInitializers(this, _deletedAt_extraInitializers);
        }
        // ── Hooks ─────────────────────────────────────────────────────
        User_1.prototype.hashPassword = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!(this.password && !this.password.startsWith('$2b$'))) return [3 /*break*/, 2];
                            _a = this;
                            return [4 /*yield*/, bcrypt.hash(this.password, 12)];
                        case 1:
                            _a.password = _b.sent();
                            _b.label = 2;
                        case 2: return [2 /*return*/];
                    }
                });
            });
        };
        // ── Helpers ───────────────────────────────────────────────────
        User_1.prototype.comparePassword = function (plainText) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, bcrypt.compare(plainText, this.password)];
                });
            });
        };
        Object.defineProperty(User_1.prototype, "fullName", {
            get: function () {
                return "".concat(this.firstName, " ").concat(this.lastName);
            },
            enumerable: false,
            configurable: true
        });
        return User_1;
    }());
    __setFunctionName(_classThis, "User");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _firstName_decorators = [(0, typeorm_1.Column)({ length: 100 })];
        _lastName_decorators = [(0, typeorm_1.Column)({ length: 100 })];
        _email_decorators = [(0, typeorm_1.Column)({ unique: true, length: 255 })];
        _phoneNumber_decorators = [(0, typeorm_1.Column)({ unique: true, length: 20, nullable: true })];
        _password_decorators = [(0, typeorm_1.Column)({ length: 255 }), (0, class_transformer_1.Exclude)()];
        _role_decorators = [(0, typeorm_1.Column)({ type: 'enum', enum: UserRole, default: UserRole.USER })];
        _status_decorators = [(0, typeorm_1.Column)({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })];
        _refreshToken_decorators = [(0, typeorm_1.Column)({ nullable: true }), (0, class_transformer_1.Exclude)()];
        _isEmailVerified_decorators = [(0, typeorm_1.Column)({ default: false })];
        _emailVerificationToken_decorators = [(0, typeorm_1.Column)({ nullable: true }), (0, class_transformer_1.Exclude)()];
        _passwordResetToken_decorators = [(0, typeorm_1.Column)({ nullable: true }), (0, class_transformer_1.Exclude)()];
        _passwordResetExpires_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true }), (0, class_transformer_1.Exclude)()];
        _avatarUrl_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _insurancePolicyNumber_decorators = [(0, typeorm_1.Column)({ nullable: true, length: 50 })];
        _insuranceProvider_decorators = [(0, typeorm_1.Column)({ nullable: true, length: 100 })];
        _vehicles_decorators = [(0, typeorm_1.OneToMany)(function () { return vehicle_entity_1.Vehicle; }, function (vehicle) { return vehicle.owner; }, { cascade: true })];
        _claims_decorators = [(0, typeorm_1.OneToMany)(function () { return claim_entity_1.Claim; }, function (claim) { return claim.submittedBy; })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        _deletedAt_decorators = [(0, typeorm_1.DeleteDateColumn)()];
        _hashPassword_decorators = [(0, typeorm_1.BeforeInsert)(), (0, typeorm_1.BeforeUpdate)()];
        __esDecorate(_classThis, null, _hashPassword_decorators, { kind: "method", name: "hashPassword", static: false, private: false, access: { has: function (obj) { return "hashPassword" in obj; }, get: function (obj) { return obj.hashPassword; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _firstName_decorators, { kind: "field", name: "firstName", static: false, private: false, access: { has: function (obj) { return "firstName" in obj; }, get: function (obj) { return obj.firstName; }, set: function (obj, value) { obj.firstName = value; } }, metadata: _metadata }, _firstName_initializers, _firstName_extraInitializers);
        __esDecorate(null, null, _lastName_decorators, { kind: "field", name: "lastName", static: false, private: false, access: { has: function (obj) { return "lastName" in obj; }, get: function (obj) { return obj.lastName; }, set: function (obj, value) { obj.lastName = value; } }, metadata: _metadata }, _lastName_initializers, _lastName_extraInitializers);
        __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: function (obj) { return "email" in obj; }, get: function (obj) { return obj.email; }, set: function (obj, value) { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
        __esDecorate(null, null, _phoneNumber_decorators, { kind: "field", name: "phoneNumber", static: false, private: false, access: { has: function (obj) { return "phoneNumber" in obj; }, get: function (obj) { return obj.phoneNumber; }, set: function (obj, value) { obj.phoneNumber = value; } }, metadata: _metadata }, _phoneNumber_initializers, _phoneNumber_extraInitializers);
        __esDecorate(null, null, _password_decorators, { kind: "field", name: "password", static: false, private: false, access: { has: function (obj) { return "password" in obj; }, get: function (obj) { return obj.password; }, set: function (obj, value) { obj.password = value; } }, metadata: _metadata }, _password_initializers, _password_extraInitializers);
        __esDecorate(null, null, _role_decorators, { kind: "field", name: "role", static: false, private: false, access: { has: function (obj) { return "role" in obj; }, get: function (obj) { return obj.role; }, set: function (obj, value) { obj.role = value; } }, metadata: _metadata }, _role_initializers, _role_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _refreshToken_decorators, { kind: "field", name: "refreshToken", static: false, private: false, access: { has: function (obj) { return "refreshToken" in obj; }, get: function (obj) { return obj.refreshToken; }, set: function (obj, value) { obj.refreshToken = value; } }, metadata: _metadata }, _refreshToken_initializers, _refreshToken_extraInitializers);
        __esDecorate(null, null, _isEmailVerified_decorators, { kind: "field", name: "isEmailVerified", static: false, private: false, access: { has: function (obj) { return "isEmailVerified" in obj; }, get: function (obj) { return obj.isEmailVerified; }, set: function (obj, value) { obj.isEmailVerified = value; } }, metadata: _metadata }, _isEmailVerified_initializers, _isEmailVerified_extraInitializers);
        __esDecorate(null, null, _emailVerificationToken_decorators, { kind: "field", name: "emailVerificationToken", static: false, private: false, access: { has: function (obj) { return "emailVerificationToken" in obj; }, get: function (obj) { return obj.emailVerificationToken; }, set: function (obj, value) { obj.emailVerificationToken = value; } }, metadata: _metadata }, _emailVerificationToken_initializers, _emailVerificationToken_extraInitializers);
        __esDecorate(null, null, _passwordResetToken_decorators, { kind: "field", name: "passwordResetToken", static: false, private: false, access: { has: function (obj) { return "passwordResetToken" in obj; }, get: function (obj) { return obj.passwordResetToken; }, set: function (obj, value) { obj.passwordResetToken = value; } }, metadata: _metadata }, _passwordResetToken_initializers, _passwordResetToken_extraInitializers);
        __esDecorate(null, null, _passwordResetExpires_decorators, { kind: "field", name: "passwordResetExpires", static: false, private: false, access: { has: function (obj) { return "passwordResetExpires" in obj; }, get: function (obj) { return obj.passwordResetExpires; }, set: function (obj, value) { obj.passwordResetExpires = value; } }, metadata: _metadata }, _passwordResetExpires_initializers, _passwordResetExpires_extraInitializers);
        __esDecorate(null, null, _avatarUrl_decorators, { kind: "field", name: "avatarUrl", static: false, private: false, access: { has: function (obj) { return "avatarUrl" in obj; }, get: function (obj) { return obj.avatarUrl; }, set: function (obj, value) { obj.avatarUrl = value; } }, metadata: _metadata }, _avatarUrl_initializers, _avatarUrl_extraInitializers);
        __esDecorate(null, null, _insurancePolicyNumber_decorators, { kind: "field", name: "insurancePolicyNumber", static: false, private: false, access: { has: function (obj) { return "insurancePolicyNumber" in obj; }, get: function (obj) { return obj.insurancePolicyNumber; }, set: function (obj, value) { obj.insurancePolicyNumber = value; } }, metadata: _metadata }, _insurancePolicyNumber_initializers, _insurancePolicyNumber_extraInitializers);
        __esDecorate(null, null, _insuranceProvider_decorators, { kind: "field", name: "insuranceProvider", static: false, private: false, access: { has: function (obj) { return "insuranceProvider" in obj; }, get: function (obj) { return obj.insuranceProvider; }, set: function (obj, value) { obj.insuranceProvider = value; } }, metadata: _metadata }, _insuranceProvider_initializers, _insuranceProvider_extraInitializers);
        __esDecorate(null, null, _vehicles_decorators, { kind: "field", name: "vehicles", static: false, private: false, access: { has: function (obj) { return "vehicles" in obj; }, get: function (obj) { return obj.vehicles; }, set: function (obj, value) { obj.vehicles = value; } }, metadata: _metadata }, _vehicles_initializers, _vehicles_extraInitializers);
        __esDecorate(null, null, _claims_decorators, { kind: "field", name: "claims", static: false, private: false, access: { has: function (obj) { return "claims" in obj; }, get: function (obj) { return obj.claims; }, set: function (obj, value) { obj.claims = value; } }, metadata: _metadata }, _claims_initializers, _claims_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: function (obj) { return "updatedAt" in obj; }, get: function (obj) { return obj.updatedAt; }, set: function (obj, value) { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, null, _deletedAt_decorators, { kind: "field", name: "deletedAt", static: false, private: false, access: { has: function (obj) { return "deletedAt" in obj; }, get: function (obj) { return obj.deletedAt; }, set: function (obj, value) { obj.deletedAt = value; } }, metadata: _metadata }, _deletedAt_initializers, _deletedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        User = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return User = _classThis;
}();
exports.User = User;

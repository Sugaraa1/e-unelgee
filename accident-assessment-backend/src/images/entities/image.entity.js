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
exports.Image = exports.ImageStatus = exports.ImageType = void 0;
var typeorm_1 = require("typeorm");
var claim_entity_1 = require("../../claims/entities/claim.entity");
var ImageType;
(function (ImageType) {
    ImageType["FRONT"] = "front";
    ImageType["REAR"] = "rear";
    ImageType["LEFT_SIDE"] = "left_side";
    ImageType["RIGHT_SIDE"] = "right_side";
    ImageType["FRONT_LEFT"] = "front_left";
    ImageType["FRONT_RIGHT"] = "front_right";
    ImageType["REAR_LEFT"] = "rear_left";
    ImageType["REAR_RIGHT"] = "rear_right";
    ImageType["INTERIOR"] = "interior";
    ImageType["ENGINE"] = "engine";
    ImageType["DAMAGE_CLOSEUP"] = "damage_closeup";
    ImageType["POLICE_REPORT"] = "police_report";
    ImageType["OTHER"] = "other";
})(ImageType || (exports.ImageType = ImageType = {}));
var ImageStatus;
(function (ImageStatus) {
    ImageStatus["PENDING"] = "pending";
    ImageStatus["PROCESSING"] = "processing";
    ImageStatus["ANALYZED"] = "analyzed";
    ImageStatus["FAILED"] = "failed";
    ImageStatus["REJECTED"] = "rejected";
})(ImageStatus || (exports.ImageStatus = ImageStatus = {}));
var Image = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('images')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _originalName_decorators;
    var _originalName_initializers = [];
    var _originalName_extraInitializers = [];
    var _fileName_decorators;
    var _fileName_initializers = [];
    var _fileName_extraInitializers = [];
    var _filePath_decorators;
    var _filePath_initializers = [];
    var _filePath_extraInitializers = [];
    var _fileUrl_decorators;
    var _fileUrl_initializers = [];
    var _fileUrl_extraInitializers = [];
    var _mimeType_decorators;
    var _mimeType_initializers = [];
    var _mimeType_extraInitializers = [];
    var _fileSize_decorators;
    var _fileSize_initializers = [];
    var _fileSize_extraInitializers = [];
    var _imageType_decorators;
    var _imageType_initializers = [];
    var _imageType_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _width_decorators;
    var _width_initializers = [];
    var _width_extraInitializers = [];
    var _height_decorators;
    var _height_initializers = [];
    var _height_extraInitializers = [];
    var _aiAnalysisResult_decorators;
    var _aiAnalysisResult_initializers = [];
    var _aiAnalysisResult_extraInitializers = [];
    var _aiConfidenceScore_decorators;
    var _aiConfidenceScore_initializers = [];
    var _aiConfidenceScore_extraInitializers = [];
    var _aiErrorMessage_decorators;
    var _aiErrorMessage_initializers = [];
    var _aiErrorMessage_extraInitializers = [];
    var _analyzedAt_decorators;
    var _analyzedAt_initializers = [];
    var _analyzedAt_extraInitializers = [];
    var _latitude_decorators;
    var _latitude_initializers = [];
    var _latitude_extraInitializers = [];
    var _longitude_decorators;
    var _longitude_initializers = [];
    var _longitude_extraInitializers = [];
    var _takenAt_decorators;
    var _takenAt_initializers = [];
    var _takenAt_extraInitializers = [];
    var _deviceModel_decorators;
    var _deviceModel_initializers = [];
    var _deviceModel_extraInitializers = [];
    var _claim_decorators;
    var _claim_initializers = [];
    var _claim_extraInitializers = [];
    var _claimId_decorators;
    var _claimId_initializers = [];
    var _claimId_extraInitializers = [];
    var _uploadedById_decorators;
    var _uploadedById_initializers = [];
    var _uploadedById_extraInitializers = [];
    var _createdAt_decorators;
    var _createdAt_initializers = [];
    var _createdAt_extraInitializers = [];
    var _updatedAt_decorators;
    var _updatedAt_initializers = [];
    var _updatedAt_extraInitializers = [];
    var Image = _classThis = /** @class */ (function () {
        function Image_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            // ── File Info ─────────────────────────────────────────────────
            this.originalName = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _originalName_initializers, void 0));
            this.fileName = (__runInitializers(this, _originalName_extraInitializers), __runInitializers(this, _fileName_initializers, void 0)); // stored filename (uuid-based)
            this.filePath = (__runInitializers(this, _fileName_extraInitializers), __runInitializers(this, _filePath_initializers, void 0)); // local path or S3 key
            this.fileUrl = (__runInitializers(this, _filePath_extraInitializers), __runInitializers(this, _fileUrl_initializers, void 0)); // public URL (CDN or S3 presigned)
            this.mimeType = (__runInitializers(this, _fileUrl_extraInitializers), __runInitializers(this, _mimeType_initializers, void 0)); // image/jpeg, image/png, etc.
            this.fileSize = (__runInitializers(this, _mimeType_extraInitializers), __runInitializers(this, _fileSize_initializers, void 0)); // bytes
            // ── Image Metadata ────────────────────────────────────────────
            this.imageType = (__runInitializers(this, _fileSize_extraInitializers), __runInitializers(this, _imageType_initializers, void 0));
            this.status = (__runInitializers(this, _imageType_extraInitializers), __runInitializers(this, _status_initializers, void 0));
            this.width = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _width_initializers, void 0));
            this.height = (__runInitializers(this, _width_extraInitializers), __runInitializers(this, _height_initializers, void 0));
            // ── AI Analysis Results ───────────────────────────────────────
            this.aiAnalysisResult = (__runInitializers(this, _height_extraInitializers), __runInitializers(this, _aiAnalysisResult_initializers, void 0));
            this.aiConfidenceScore = (__runInitializers(this, _aiAnalysisResult_extraInitializers), __runInitializers(this, _aiConfidenceScore_initializers, void 0)); // 0.0000 – 1.0000
            this.aiErrorMessage = (__runInitializers(this, _aiConfidenceScore_extraInitializers), __runInitializers(this, _aiErrorMessage_initializers, void 0));
            this.analyzedAt = (__runInitializers(this, _aiErrorMessage_extraInitializers), __runInitializers(this, _analyzedAt_initializers, void 0));
            // ── GPS / EXIF ────────────────────────────────────────────────
            this.latitude = (__runInitializers(this, _analyzedAt_extraInitializers), __runInitializers(this, _latitude_initializers, void 0));
            this.longitude = (__runInitializers(this, _latitude_extraInitializers), __runInitializers(this, _longitude_initializers, void 0));
            this.takenAt = (__runInitializers(this, _longitude_extraInitializers), __runInitializers(this, _takenAt_initializers, void 0)); // from EXIF data
            this.deviceModel = (__runInitializers(this, _takenAt_extraInitializers), __runInitializers(this, _deviceModel_initializers, void 0)); // camera/phone model from EXIF
            // ── Relation ──────────────────────────────────────────────────
            this.claim = (__runInitializers(this, _deviceModel_extraInitializers), __runInitializers(this, _claim_initializers, void 0));
            this.claimId = (__runInitializers(this, _claim_extraInitializers), __runInitializers(this, _claimId_initializers, void 0));
            this.uploadedById = (__runInitializers(this, _claimId_extraInitializers), __runInitializers(this, _uploadedById_initializers, void 0));
            // ── Timestamps ────────────────────────────────────────────────
            this.createdAt = (__runInitializers(this, _uploadedById_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
            this.updatedAt = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _updatedAt_initializers, void 0));
            __runInitializers(this, _updatedAt_extraInitializers);
        }
        return Image_1;
    }());
    __setFunctionName(_classThis, "Image");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _originalName_decorators = [(0, typeorm_1.Column)({ length: 255 })];
        _fileName_decorators = [(0, typeorm_1.Column)({ length: 255 })];
        _filePath_decorators = [(0, typeorm_1.Column)({ length: 500 })];
        _fileUrl_decorators = [(0, typeorm_1.Column)({ nullable: true, length: 500 })];
        _mimeType_decorators = [(0, typeorm_1.Column)({ length: 50 })];
        _fileSize_decorators = [(0, typeorm_1.Column)({ type: 'int' })];
        _imageType_decorators = [(0, typeorm_1.Column)({ type: 'enum', enum: ImageType, default: ImageType.OTHER })];
        _status_decorators = [(0, typeorm_1.Column)({ type: 'enum', enum: ImageStatus, default: ImageStatus.PENDING })];
        _width_decorators = [(0, typeorm_1.Column)({ type: 'int', nullable: true })];
        _height_decorators = [(0, typeorm_1.Column)({ type: 'int', nullable: true })];
        _aiAnalysisResult_decorators = [(0, typeorm_1.Column)({ type: 'jsonb', nullable: true })];
        _aiConfidenceScore_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 4, nullable: true })];
        _aiErrorMessage_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _analyzedAt_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _latitude_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 8, nullable: true })];
        _longitude_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 11, scale: 8, nullable: true })];
        _takenAt_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _deviceModel_decorators = [(0, typeorm_1.Column)({ nullable: true, length: 100 })];
        _claim_decorators = [(0, typeorm_1.ManyToOne)(function () { return claim_entity_1.Claim; }, function (claim) { return claim.images; }, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'claimId' })];
        _claimId_decorators = [(0, typeorm_1.Column)()];
        _uploadedById_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _createdAt_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _updatedAt_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _originalName_decorators, { kind: "field", name: "originalName", static: false, private: false, access: { has: function (obj) { return "originalName" in obj; }, get: function (obj) { return obj.originalName; }, set: function (obj, value) { obj.originalName = value; } }, metadata: _metadata }, _originalName_initializers, _originalName_extraInitializers);
        __esDecorate(null, null, _fileName_decorators, { kind: "field", name: "fileName", static: false, private: false, access: { has: function (obj) { return "fileName" in obj; }, get: function (obj) { return obj.fileName; }, set: function (obj, value) { obj.fileName = value; } }, metadata: _metadata }, _fileName_initializers, _fileName_extraInitializers);
        __esDecorate(null, null, _filePath_decorators, { kind: "field", name: "filePath", static: false, private: false, access: { has: function (obj) { return "filePath" in obj; }, get: function (obj) { return obj.filePath; }, set: function (obj, value) { obj.filePath = value; } }, metadata: _metadata }, _filePath_initializers, _filePath_extraInitializers);
        __esDecorate(null, null, _fileUrl_decorators, { kind: "field", name: "fileUrl", static: false, private: false, access: { has: function (obj) { return "fileUrl" in obj; }, get: function (obj) { return obj.fileUrl; }, set: function (obj, value) { obj.fileUrl = value; } }, metadata: _metadata }, _fileUrl_initializers, _fileUrl_extraInitializers);
        __esDecorate(null, null, _mimeType_decorators, { kind: "field", name: "mimeType", static: false, private: false, access: { has: function (obj) { return "mimeType" in obj; }, get: function (obj) { return obj.mimeType; }, set: function (obj, value) { obj.mimeType = value; } }, metadata: _metadata }, _mimeType_initializers, _mimeType_extraInitializers);
        __esDecorate(null, null, _fileSize_decorators, { kind: "field", name: "fileSize", static: false, private: false, access: { has: function (obj) { return "fileSize" in obj; }, get: function (obj) { return obj.fileSize; }, set: function (obj, value) { obj.fileSize = value; } }, metadata: _metadata }, _fileSize_initializers, _fileSize_extraInitializers);
        __esDecorate(null, null, _imageType_decorators, { kind: "field", name: "imageType", static: false, private: false, access: { has: function (obj) { return "imageType" in obj; }, get: function (obj) { return obj.imageType; }, set: function (obj, value) { obj.imageType = value; } }, metadata: _metadata }, _imageType_initializers, _imageType_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _width_decorators, { kind: "field", name: "width", static: false, private: false, access: { has: function (obj) { return "width" in obj; }, get: function (obj) { return obj.width; }, set: function (obj, value) { obj.width = value; } }, metadata: _metadata }, _width_initializers, _width_extraInitializers);
        __esDecorate(null, null, _height_decorators, { kind: "field", name: "height", static: false, private: false, access: { has: function (obj) { return "height" in obj; }, get: function (obj) { return obj.height; }, set: function (obj, value) { obj.height = value; } }, metadata: _metadata }, _height_initializers, _height_extraInitializers);
        __esDecorate(null, null, _aiAnalysisResult_decorators, { kind: "field", name: "aiAnalysisResult", static: false, private: false, access: { has: function (obj) { return "aiAnalysisResult" in obj; }, get: function (obj) { return obj.aiAnalysisResult; }, set: function (obj, value) { obj.aiAnalysisResult = value; } }, metadata: _metadata }, _aiAnalysisResult_initializers, _aiAnalysisResult_extraInitializers);
        __esDecorate(null, null, _aiConfidenceScore_decorators, { kind: "field", name: "aiConfidenceScore", static: false, private: false, access: { has: function (obj) { return "aiConfidenceScore" in obj; }, get: function (obj) { return obj.aiConfidenceScore; }, set: function (obj, value) { obj.aiConfidenceScore = value; } }, metadata: _metadata }, _aiConfidenceScore_initializers, _aiConfidenceScore_extraInitializers);
        __esDecorate(null, null, _aiErrorMessage_decorators, { kind: "field", name: "aiErrorMessage", static: false, private: false, access: { has: function (obj) { return "aiErrorMessage" in obj; }, get: function (obj) { return obj.aiErrorMessage; }, set: function (obj, value) { obj.aiErrorMessage = value; } }, metadata: _metadata }, _aiErrorMessage_initializers, _aiErrorMessage_extraInitializers);
        __esDecorate(null, null, _analyzedAt_decorators, { kind: "field", name: "analyzedAt", static: false, private: false, access: { has: function (obj) { return "analyzedAt" in obj; }, get: function (obj) { return obj.analyzedAt; }, set: function (obj, value) { obj.analyzedAt = value; } }, metadata: _metadata }, _analyzedAt_initializers, _analyzedAt_extraInitializers);
        __esDecorate(null, null, _latitude_decorators, { kind: "field", name: "latitude", static: false, private: false, access: { has: function (obj) { return "latitude" in obj; }, get: function (obj) { return obj.latitude; }, set: function (obj, value) { obj.latitude = value; } }, metadata: _metadata }, _latitude_initializers, _latitude_extraInitializers);
        __esDecorate(null, null, _longitude_decorators, { kind: "field", name: "longitude", static: false, private: false, access: { has: function (obj) { return "longitude" in obj; }, get: function (obj) { return obj.longitude; }, set: function (obj, value) { obj.longitude = value; } }, metadata: _metadata }, _longitude_initializers, _longitude_extraInitializers);
        __esDecorate(null, null, _takenAt_decorators, { kind: "field", name: "takenAt", static: false, private: false, access: { has: function (obj) { return "takenAt" in obj; }, get: function (obj) { return obj.takenAt; }, set: function (obj, value) { obj.takenAt = value; } }, metadata: _metadata }, _takenAt_initializers, _takenAt_extraInitializers);
        __esDecorate(null, null, _deviceModel_decorators, { kind: "field", name: "deviceModel", static: false, private: false, access: { has: function (obj) { return "deviceModel" in obj; }, get: function (obj) { return obj.deviceModel; }, set: function (obj, value) { obj.deviceModel = value; } }, metadata: _metadata }, _deviceModel_initializers, _deviceModel_extraInitializers);
        __esDecorate(null, null, _claim_decorators, { kind: "field", name: "claim", static: false, private: false, access: { has: function (obj) { return "claim" in obj; }, get: function (obj) { return obj.claim; }, set: function (obj, value) { obj.claim = value; } }, metadata: _metadata }, _claim_initializers, _claim_extraInitializers);
        __esDecorate(null, null, _claimId_decorators, { kind: "field", name: "claimId", static: false, private: false, access: { has: function (obj) { return "claimId" in obj; }, get: function (obj) { return obj.claimId; }, set: function (obj, value) { obj.claimId = value; } }, metadata: _metadata }, _claimId_initializers, _claimId_extraInitializers);
        __esDecorate(null, null, _uploadedById_decorators, { kind: "field", name: "uploadedById", static: false, private: false, access: { has: function (obj) { return "uploadedById" in obj; }, get: function (obj) { return obj.uploadedById; }, set: function (obj, value) { obj.uploadedById = value; } }, metadata: _metadata }, _uploadedById_initializers, _uploadedById_extraInitializers);
        __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: function (obj) { return "createdAt" in obj; }, get: function (obj) { return obj.createdAt; }, set: function (obj, value) { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
        __esDecorate(null, null, _updatedAt_decorators, { kind: "field", name: "updatedAt", static: false, private: false, access: { has: function (obj) { return "updatedAt" in obj; }, get: function (obj) { return obj.updatedAt; }, set: function (obj, value) { obj.updatedAt = value; } }, metadata: _metadata }, _updatedAt_initializers, _updatedAt_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Image = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Image = _classThis;
}();
exports.Image = Image;

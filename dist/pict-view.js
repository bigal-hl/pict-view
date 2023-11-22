"use strict";

function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
(function (f) {
  if (typeof exports === "object" && typeof module !== "undefined") {
    module.exports = f();
  } else if (typeof define === "function" && define.amd) {
    define([], f);
  } else {
    var g;
    if (typeof window !== "undefined") {
      g = window;
    } else if (typeof global !== "undefined") {
      g = global;
    } else if (typeof self !== "undefined") {
      g = self;
    } else {
      g = this;
    }
    g.PictView = f();
  }
})(function () {
  var define, module, exports;
  return function () {
    function r(e, n, t) {
      function o(i, f) {
        if (!n[i]) {
          if (!e[i]) {
            var c = "function" == typeof require && require;
            if (!f && c) return c(i, !0);
            if (u) return u(i, !0);
            var a = new Error("Cannot find module '" + i + "'");
            throw a.code = "MODULE_NOT_FOUND", a;
          }
          var p = n[i] = {
            exports: {}
          };
          e[i][0].call(p.exports, function (r) {
            var n = e[i][1][r];
            return o(n || r);
          }, p, p.exports, r, e, n, t);
        }
        return n[i].exports;
      }
      for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
      return o;
    }
    return r;
  }()({
    1: [function (require, module, exports) {
      /**
      * Fable Service Base
      * @author <steven@velozo.com>
      */

      class FableServiceProviderBase {
        // The constructor can be used in two ways:
        // 1) With a fable, options object and service hash (the options object and service hash are optional)
        // 2) With an object or nothing as the first parameter, where it will be treated as the options object
        constructor(pFable, pOptions, pServiceHash) {
          // Check if a fable was passed in; connect it if so
          if (typeof pFable === 'object' && pFable.isFable) {
            this.connectFable(pFable);
          } else {
            this.fable = false;
          }

          // initialize options and UUID based on whether the fable was passed in or not.
          if (this.fable) {
            this.UUID = pFable.getUUID();
            this.options = typeof pOptions === 'object' ? pOptions : {};
          } else {
            // With no fable, check to see if there was an object passed into either of the first two
            // Parameters, and if so, treat it as the options object
            this.options = typeof pFable === 'object' && !pFable.isFable ? pFable : typeof pOptions === 'object' ? pOptions : {};
            this.UUID = "CORE-SVC-".concat(Math.floor(Math.random() * (99999 - 10000) + 10000));
          }

          // It's expected that the deriving class will set this
          this.serviceType = "Unknown-".concat(this.UUID);

          // The service hash is used to identify the specific instantiation of the service in the services map
          this.Hash = typeof pServiceHash === 'string' ? pServiceHash : !this.fable && typeof pOptions === 'string' ? pOptions : "".concat(this.UUID);
        }
        connectFable(pFable) {
          if (typeof pFable !== 'object' || !pFable.isFable) {
            let tmpErrorMessage = "Fable Service Provider Base: Cannot connect to Fable, invalid Fable object passed in.  The pFable parameter was a [".concat(typeof pFable, "].}");
            console.log(tmpErrorMessage);
            return new Error(tmpErrorMessage);
          }
          if (!this.fable) {
            this.fable = pFable;
          }
          if (!this.log) {
            this.log = this.fable.Logging;
          }
          if (!this.services) {
            this.services = this.fable.services;
          }
          if (!this.servicesMap) {
            this.servicesMap = this.fable.servicesMap;
          }
          return true;
        }
      }
      _defineProperty(FableServiceProviderBase, "isFableService", true);
      module.exports = FableServiceProviderBase;

      // This is left here in case we want to go back to having different code/base class for "core" services
      module.exports.CoreServiceProviderBase = FableServiceProviderBase;
    }, {}],
    2: [function (require, module, exports) {
      const libFableServiceBase = require('fable-serviceproviderbase');
      const defaultPictViewSettings = {
        DefaultRenderable: false,
        DefaultDestinationAddress: false,
        DefaultTemplateRecordAddress: false,
        ViewIdentifier: false,
        // If this is set to true, when the App initializes this will.
        // After the App initializes, initialize will be called as soon as it's added.
        AutoInitialize: true,
        AutoInitializeOrdinal: 0,
        // If this is set to true, when the App autorenders (on load) this will.
        // After the App initializes, render will be called as soon as it's added.
        AutoRender: true,
        AutoRenderOrdinal: 0,
        AutoSolveWithApp: true,
        AutoSolveOrdinal: 0,
        CSSHash: false,
        CSS: false,
        CSSProvider: false,
        CSSPriority: 500,
        Templates: [],
        DefaultTemplates: [],
        Renderables: [],
        Manifests: {}
      };
      class PictView extends libFableServiceBase {
        constructor(pFable, pOptions, pServiceHash) {
          // Intersect default options, parent constructor, service information
          let tmpOptions = Object.assign({}, JSON.parse(JSON.stringify(defaultPictViewSettings)), pOptions);
          super(pFable, tmpOptions, pServiceHash);
          if (!this.options.ViewIdentifier) {
            this.options.ViewIdentifier = "AutoViewID-".concat(this.fable.getUUID());
          }
          this.serviceType = 'PictView';
          // Convenience and consistency naming
          this.pict = this.fable;
          // Wire in the essential Pict application state
          this.AppData = this.pict.AppData;
          this.initializeTimestamp = false;
          this.lastSolvedTimestamp = false;
          this.lastRenderedTimestamp = false;
          this.lastMarshalFromViewTimestamp = false;
          this.lastMarshalToViewTimestamp = false;

          // Load all templates from the array in the options
          // Templates are in the form of {Hash:'Some-Template-Hash',Template:'Template content',Source:'TemplateSource'}
          for (let i = 0; i < this.options.Templates.length; i++) {
            let tmpTemplate = this.options.Templates[i];
            if (!tmpTemplate.hasOwnProperty('Hash') || !tmpTemplate.hasOwnProperty('Template')) {
              this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not load Template ").concat(i, " in the options array."), tmpTemplate);
            } else {
              if (!tmpTemplate.Source) {
                tmpTemplate.Source = "PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " options object.");
              }
              this.pict.TemplateProvider.addTemplate(tmpTemplate.Hash, tmpTemplate.Template, tmpTemplate.Source);
            }
          }

          // Load all default templates from the array in the options
          // Templates are in the form of {Prefix:'',Postfix:'-List-Row',Template:'Template content',Source:'TemplateSourceString'}
          for (let i = 0; i < this.options.DefaultTemplates.length; i++) {
            let tmpDefaultTemplate = this.options.DefaultTemplates[i];
            if (!tmpDefaultTemplate.hasOwnProperty('Postfix') || !tmpDefaultTemplate.hasOwnProperty('Template')) {
              this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not load Default Template ").concat(i, " in the options array."), tmpDefaultTemplate);
            } else {
              if (!tmpDefaultTemplate.Source) {
                tmpDefaultTemplate.Source = "PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " options object.");
              }
              this.pict.TemplateProvider.addDefaultTemplate(tmpDefaultTemplate.Prefix, tmpDefaultTemplate.Postfix, tmpDefaultTemplate.Template, tmpDefaultTemplate.Source);
            }
          }

          // Load the CSS if it's available
          if (this.options.CSS) {
            let tmpCSSHash = this.options.CSSHash ? this.options.CSSHash : "View-".concat(this.options.ViewIdentifier);
            let tmpCSSProvider = this.options.CSSProvider ? this.options.CSSProvider : tmpCSSHash;
            this.pict.CSSMap.addCSS(tmpCSSHash, this.options.CSS, tmpCSSProvider, this.options.CSSPriority);
          }

          // Load all renderables
          // Renderables are launchable renderable instructions with templates
          // They look as such: {Identifier:'ContentEntry', TemplateHash:'Content-Entry-Section-Main', ContentDestinationAddress:'#ContentSection', RecordAddress:'AppData.Content.DefaultText', ManifestTransformation:'ManyfestHash', ManifestDestinationAddress:'AppData.Content.DataToTransformContent'}
          // The only parts that are necessary are Identifier and Template
          // A developer can then do render('ContentEntry') and it just kinda works.  Or they can override the ContentDestinationAddress
          this.renderables = {};
          for (let i = 0; i < this.options.Renderables.length; i++) {
            let tmpRenderable = this.options.Renderables[i];
            this.addRenderable(this.options.Renderables[i]);
          }
        }
        addRenderable(pRenderableHash, pTemplateHash, pDefaultTemplateDataAddress, pDefaultDestinationAddress, pRenderMethod) {
          let tmpRenderable = false;
          if (typeof pRenderableHash == 'object') {
            // The developer passed in the renderable as an object.
            // Use theirs instead!
            tmpRenderable = pRenderableHash;
          } else {
            let tmpRenderMethod = typeof pRenderMethod !== 'string' ? pRenderMethod : 'replace';
            tmpRenderable = {
              RenderableHash: pRenderableHash,
              TemplateHash: pTemplateHash,
              DefaultTemplateDataAddress: pDefaultTemplateDataAddress,
              DefaultDestinationAddress: pDefaultDestinationAddress,
              RenderMethod: tmpRenderMethod
            };
          }
          if (typeof tmpRenderable.RenderableHash != 'string' || typeof tmpRenderable.TemplateHash != 'string') {
            this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not load Renderable; RenderableHash or TemplateHash are invalid."), tmpRenderable);
          } else {
            if (this.pict.LogNoisiness > 0) {
              this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " adding renderable [").concat(tmpRenderable.RenderableHash, "] pointed to template ").concat(tmpRenderable.TemplateHash, "."));
            }
            this.renderables[tmpRenderable.RenderableHash] = tmpRenderable;
          }
        }

        /* -------------------------------------------------------------------------- */
        /*                        Code Section: Initialization                        */
        /* -------------------------------------------------------------------------- */
        onBeforeInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onBeforeInitialize:"));
          }
          return true;
        }
        onBeforeInitializeAsync(fCallback) {
          this.onBeforeInitialize();
          return fCallback();
        }
        onInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onInitialize:"));
          }
          return true;
        }
        onInitializeAsync(fCallback) {
          this.onInitialize();
          return fCallback();
        }
        initialize() {
          if (!this.initializeTimestamp) {
            this.onBeforeInitialize();
            this.onInitialize();
            this.onAfterInitialize();
            this.initializeTimestamp = this.pict.log.getTimeStamp();
            return true;
          } else {
            this.log.warn("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " initialize called but initialization is already completed.  Aborting."));
            return false;
          }
        }
        initializeAsync(fCallback) {
          if (!this.initializeTimestamp) {
            let tmpAnticipate = this.pict.instantiateServiceProviderWithoutRegistration('Anticipate');
            if (this.pict.LogNoisiness > 0) {
              this.log.info("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " beginning initialization..."));
            }
            tmpAnticipate.anticipate(this.onBeforeInitializeAsync.bind(this));
            tmpAnticipate.anticipate(this.onInitializeAsync.bind(this));
            tmpAnticipate.anticipate(this.onAfterInitializeAsync.bind(this));
            tmpAnticipate.wait(pError => {
              this.initializeTimestamp = this.pict.log.getTimeStamp();
              if (this.pict.LogNoisiness > 0) {
                this.log.info("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " initialization complete."));
              }
              return fCallback();
            });
          } else {
            this.log.warn("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " async initialize called but initialization is already completed.  Aborting."));
            // TODO: Should this be an error?
            return fCallback();
          }
        }
        onAfterInitialize() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onAfterInitialize:"));
          }
          return true;
        }
        onAfterInitializeAsync(fCallback) {
          this.onAfterInitialize();
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                            Code Section: Render                            */
        /* -------------------------------------------------------------------------- */
        onBeforeRender(pRenderable, pRenderDestinationAddress, pData) {
          // Overload this to mess with stuff before the content gets generated from the template
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onBeforeRender:"));
          }
          return true;
        }
        onBeforeRenderAsync(fCallback) {
          this.onBeforeRender(pRenderable, pRenderDestinationAddress, pData);
          return fCallback();
        }
        render(pRenderable, pRenderDestinationAddress, pTemplateDataAddress) {
          let tmpRenderableHash = typeof pRenderable === 'string' ? pRenderable : typeof this.options.DefaultRenderable == 'string' ? this.options.DefaultRenderable : false;
          if (!tmpRenderableHash) {
            this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not render ").concat(tmpRenderableHash, " (param ").concat(pRenderable, ") because it is not a valid renderable."));
            return false;
          }
          let tmpRenderable = this.renderables[tmpRenderableHash];
          if (!tmpRenderable) {
            this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not render ").concat(tmpRenderableHash, " (param ").concat(pRenderable, ") because it does not exist."));
            return false;
          }
          let tmpRenderDestinationAddress = typeof pRenderDestinationAddress === 'string' ? pRenderDestinationAddress : typeof tmpRenderable.ContentDestinationAddress === 'string' ? tmpRenderable.ContentDestinationAddress : typeof this.options.DefaultDestinationAddress === 'string' ? this.options.DefaultDestinationAddress : false;
          if (!tmpRenderDestinationAddress) {
            this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not render ").concat(tmpRenderableHash, " (param ").concat(pRenderable, ") because it does not have a valid destination address."));
            return false;
          }
          let tmpDataAddress;
          let tmpData;
          if (typeof pTemplateDataAddress === 'object') {
            tmpData = pTemplateDataAddress;
            tmpDataAddress = 'Passed in as object';
          } else {
            tmpDataAddress = typeof pTemplateDataAddress === 'string' ? pTemplateDataAddress : typeof tmpRenderable.DefaultTemplateRecordAddress === 'string' ? tmpRenderable.DefaultTemplateRecordAddress : typeof this.options.DefaultTemplateRecordAddress === 'string' ? this.options.DefaultTemplateRecordAddress : false;
            tmpData = typeof tmpDataAddress === 'string' ? this.pict.DataProvider.getDataByAddress(tmpDataAddress) : undefined;
          }

          // Execute the developer-overridable pre-render behavior
          this.onBeforeRender(tmpRenderable, tmpRenderDestinationAddress, tmpData);

          // Generate the content output from the template and data
          let tmpContent = this.pict.parseTemplateByHash(tmpRenderable.TemplateHash, tmpData);

          // Assign the content to the destination address
          switch (tmpRenderable.RenderMethod) {
            case 'append':
              this.pict.ContentAssignment.appendContent(tmpRenderDestinationAddress, tmpContent);
              break;
            case 'prepend':
              this.pict.ContentAssignment.prependContent(tmpRenderDestinationAddress, tmpContent);
              break;
            case 'append_once':
              // Try to find the content in the destination address
              let tmpExistingContent = this.pict.ContentAssignment.getElement("#".concat(tmpRenderableHash));
              if (tmpExistingContent.length < 1) {
                this.pict.ContentAssignment.appendContent(tmpRenderDestinationAddress, tmpContent);
              }
            case 'replace':
            default:
              this.pict.ContentAssignment.assignContent(tmpRenderDestinationAddress, tmpContent);
              break;
          }

          // Execute the developer-overridable post-render behavior
          this.onAfterRender(tmpRenderable, tmpRenderDestinationAddress, tmpData, tmpContent);
          this.lastRenderedTimestamp = this.pict.log.getTimeStamp();
          return true;
        }
        renderAsync(pRenderable, pRenderDestinationAddress, pTemplateDataAddress, fCallback) {
          let tmpRenderableHash = typeof pRenderable === 'string' ? pRenderable : typeof this.options.DefaultRenderable == 'string' ? this.options.DefaultRenderable : false;
          if (!tmpRenderableHash) {
            this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not asynchronously render ").concat(tmpRenderableHash, " (param ").concat(pRenderable, "because it is not a valid renderable."));
            return fCallback(Error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not asynchronously render ").concat(tmpRenderableHash, " (param ").concat(pRenderable, "because it is not a valid renderable.")));
          }
          let tmpRenderable = this.renderables[tmpRenderableHash];
          if (!tmpRenderable) {
            this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not render ").concat(tmpRenderableHash, " (param ").concat(pRenderable, ") because it does not exist."));
            return fCallback(Error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not render ").concat(tmpRenderableHash, " (param ").concat(pRenderable, ") because it does not exist.")));
          }
          let tmpRenderDestinationAddress = typeof pRenderDestinationAddress === 'string' ? pRenderDestinationAddress : typeof tmpRenderable.ContentDestinationAddress === 'string' ? tmpRenderable.ContentDestinationAddress : typeof this.options.DefaultDestinationAddress === 'string' ? this.options.DefaultDestinationAddress : false;
          if (!tmpRenderDestinationAddress) {
            this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not render ").concat(tmpRenderableHash, " (param ").concat(pRenderable, ") because it does not have a valid destination address."));
            return fCallback(Error("Could not render ".concat(tmpRenderableHash)));
          }
          let tmpDataAddress;
          let tmpData;
          if (typeof pTemplateDataAddress === 'object') {
            tmpData = pTemplateDataAddress;
            tmpDataAddress = 'Passed in as object';
          } else {
            tmpDataAddress = typeof pTemplateDataAddress === 'string' ? pTemplateDataAddress : typeof tmpRenderable.DefaultTemplateRecordAddress === 'string' ? tmpRenderable.DefaultTemplateRecordAddress : typeof this.options.DefaultTemplateRecordAddress === 'string' ? this.options.DefaultTemplateRecordAddress : false;
            tmpData = typeof tmpDataAddress === 'string' ? this.pict.DataProvider.getDataByAddress(tmpDataAddress) : undefined;
          }
          let tmpAnticipate = this.fable.newAnticipate();

          // Execute the developer-overridable pre-render behavior
          //this.onBeforeRender(tmpRenderable, tmpRenderDestinationAddress, tmpData);

          tmpAnticipate.anticipate(fOnBeforeRenderCallback => {
            this.onBeforeRenderAsync(tmpRenderable, tmpRenderDestinationAddress, tmpData, pError => {
              return fOnBeforeRenderCallback(pError);
            });
          });
          tmpAnticipate.anticipate(fAsyncTemplateCallback => {
            // Render the template (asynchronously)
            this.pict.parseTemplateByHash(tmpRenderable.TemplateHash, tmpData, (pError, pContent) => {
              if (pError) {
                this.log.error("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " could not render (asynchronously) ").concat(tmpRenderableHash, " (param ").concat(pRenderable, ") because it did not parse the template."), pError);
                return fAsyncTemplateCallback(pError);
              }

              // Assign the content to the destination address
              switch (tmpRenderable.RenderMethod) {
                case 'append':
                  this.pict.ContentAssignment.appendContent(tmpRenderDestinationAddress, pContent);
                  break;
                case 'prepend':
                  this.pict.ContentAssignment.prependContent(tmpRenderDestinationAddress, pContent);
                  break;
                case 'append_once':
                  // Try to find the content in the destination address
                  let tmpExistingContent = this.pict.ContentAssignment.getElement("#".concat(tmpRenderableHash));
                  if (tmpExistingContent.length < 1) {
                    this.pict.ContentAssignment.appendContent(tmpRenderDestinationAddress, pContent);
                  }
                case 'replace':
                default:
                  this.pict.ContentAssignment.assignContent(tmpRenderDestinationAddress, pContent);
                  break;
              }

              // Execute the developer-overridable asynchronous post-render behavior
              this.lastRenderedTimestamp = this.pict.log.getTimeStamp();
              return this.onAfterRenderAsync(fAsyncTemplateCallback, pContent);
            });
          });
          tmpAnticipate.wait(fCallback);
        }
        onAfterRender() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onAfterRender:"));
          }
          return true;
        }
        onAfterRenderAsync(fCallback) {
          this.onAfterRender();
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                            Code Section: Solver                            */
        /* -------------------------------------------------------------------------- */
        onBeforeSolve() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onBeforeSolve:"));
          }
          return true;
        }
        onBeforeSolveAsync(fCallback) {
          this.onBeforeSolve();
          return fCallback();
        }
        onSolve() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onSolve:"));
          }
          return true;
        }
        onSolveAsync(fCallback) {
          this.onSolve();
          return fCallback();
        }
        solve() {
          if (this.pict.LogNoisiness > 2) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " executing solve() function..."));
          }
          this.onBeforeSolve();
          this.onSolve();
          this.onAfterSolve();
          this.lastSolvedTimestamp = this.pict.log.getTimeStamp();
          return true;
        }
        solveAsync(fCallback) {
          let tmpAnticipate = this.pict.instantiateServiceProviderWithoutRegistration('Anticipate');
          tmpAnticipate.anticipate(this.onBeforeSolveAsync.bind(this));
          tmpAnticipate.anticipate(this.onSolveAsync.bind(this));
          tmpAnticipate.anticipate(this.onAfterSolveAsync.bind(this));
          tmpAnticipate.wait(pError => {
            if (this.pict.LogNoisiness > 2) {
              this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " solveAsync() complete."));
            }
            this.lastSolvedTimestamp = this.pict.log.getTimeStamp();
            return fCallback(pError);
          });
        }
        onAfterSolve() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onAfterSolve:"));
          }
          return true;
        }
        onAfterSolveAsync(fCallback) {
          this.onAfterSolve();
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Marshal From View                        */
        /* -------------------------------------------------------------------------- */
        onBeforeMarshalFromView() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onBeforeMarshalFromView:"));
          }
          return true;
        }
        onBeforeMarshalFromViewAsync(fCallback) {
          this.onBeforeMarshalFromView();
          return fCallback();
        }
        onMarshalFromView() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onMarshalFromView:"));
          }
          return true;
        }
        onMarshalFromViewAsync(fCallback) {
          this.onMarshalFromView();
          return fCallback();
        }
        marshalFromView() {
          if (this.pict.LogNoisiness > 2) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " executing solve() function..."));
          }
          this.onBeforeMarshalFromView();
          this.onMarshalFromView();
          this.onAfterMarshalFromView();
          this.lastMarshalFromViewTimestamp = this.pict.log.getTimeStamp();
          return true;
        }
        marshalFromViewAsync(fCallback) {
          let tmpAnticipate = this.pict.instantiateServiceProviderWithoutRegistration('Anticipate');
          tmpAnticipate.anticipate(this.onBeforeMarshalFromViewAsync.bind(this));
          tmpAnticipate.anticipate(this.onMarshalFromViewAsync.bind(this));
          tmpAnticipate.anticipate(this.onAfterMarshalFromViewAsync.bind(this));
          tmpAnticipate.wait(pError => {
            if (this.pict.LogNoisiness > 2) {
              this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " solveAsync() complete."));
            }
            this.lastMarshalFromViewTimestamp = this.pict.log.getTimeStamp();
            return fCallback(pError);
          });
        }
        onAfterMarshalFromView() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onAfterMarshalFromView:"));
          }
          return true;
        }
        onAfterMarshalFromViewAsync(fCallback) {
          this.onAfterMarshalFromView();
          return fCallback();
        }

        /* -------------------------------------------------------------------------- */
        /*                     Code Section: Marshal To View                          */
        /* -------------------------------------------------------------------------- */
        onBeforeMarshalToView() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onBeforeMarshalToView:"));
          }
          return true;
        }
        onBeforeMarshalToViewAsync(fCallback) {
          this.onBeforeMarshalToView();
          return fCallback();
        }
        onMarshalToView() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onMarshalToView:"));
          }
          return true;
        }
        onMarshalToViewAsync(fCallback) {
          this.onMarshalToView();
          return fCallback();
        }
        marshalToView() {
          if (this.pict.LogNoisiness > 2) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " executing solve() function..."));
          }
          this.onBeforeMarshalToView();
          this.onMarshalToView();
          this.onAfterMarshalToView();
          this.lastMarshalToViewTimestamp = this.pict.log.getTimeStamp();
          return true;
        }
        marshalToViewAsync(fCallback) {
          let tmpAnticipate = this.pict.instantiateServiceProviderWithoutRegistration('Anticipate');
          tmpAnticipate.anticipate(this.onBeforeMarshalToViewAsync.bind(this));
          tmpAnticipate.anticipate(this.onMarshalToViewAsync.bind(this));
          tmpAnticipate.anticipate(this.onAfterMarshalToViewAsync.bind(this));
          tmpAnticipate.wait(pError => {
            if (this.pict.LogNoisiness > 2) {
              this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " solveAsync() complete."));
            }
            this.lastMarshalToViewTimestamp = this.pict.log.getTimeStamp();
            return fCallback(pError);
          });
        }
        onAfterMarshalToView() {
          if (this.pict.LogNoisiness > 3) {
            this.log.trace("PictView [".concat(this.UUID, "]::[").concat(this.Hash, "] ").concat(this.options.ViewIdentifier, " onAfterMarshalToView:"));
          }
          return true;
        }
        onAfterMarshalToViewAsync(fCallback) {
          this.onAfterMarshalToView();
          return fCallback();
        }
      }
      module.exports = PictView;
    }, {
      "fable-serviceproviderbase": 1
    }]
  }, {}, [2])(2);
});
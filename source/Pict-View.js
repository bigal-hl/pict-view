const libFableServiceBase = require('fable-serviceproviderbase');

const defaultPictViewSettings = (
	{
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

		Templates: [],

		DefaultTemplates: [],

		Renderables: [],

		Manifests: {}
	});

class PictView extends libFableServiceBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		// Intersect default options, parent constructor, service information
		let tmpOptions = Object.assign({}, JSON.parse(JSON.stringify(defaultPictViewSettings)), pOptions);
		super(pFable, tmpOptions, pServiceHash);
		if (!this.options.ViewIdentifier)
		{
			this.options.ViewIdentifier = `AutoViewID-${this.fable.getUUID()}`;
		}
		this.serviceType = 'PictView';
		// Convenience and consistency naming
		this.pict = this.fable;
		// Wire in the essential Pict application state
		this.AppData = this.fable.AppData;

		this.initializeTimestamp = false;
		this.lastSolvedTimestamp = false;
		this.lastRenderedTimestamp = false;

		// Load all templates from the array in the options
		// Templates are in the form of {Hash:'Some-Template-Hash',Template:'Template content',Source:'TemplateSource'}
		for (let i = 0; i < this.options.Templates.length; i++)
		{
			let tmpTemplate = this.options.Templates[i];

			if (!tmpTemplate.hasOwnProperty('Hash') || !tmpTemplate.hasOwnProperty('Template'))
			{
				this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not load Template ${i} in the options array.`, tmpTemplate);
			}
			else
			{
				if (!tmpTemplate.Source)
				{
					tmpTemplate.Source = `PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} options object.`;
				}
				this.fable.TemplateProvider.addTemplate(tmpTemplate.Hash, tmpTemplate.Template, tmpTemplate.Source);
			}
		}

		// Load all default templates from the array in the options
		// Templates are in the form of {Prefix:'',Postfix:'-List-Row',Template:'Template content',Source:'TemplateSourceString'}
		for (let i = 0; i < this.options.DefaultTemplates.length; i++)
		{
			let tmpDefaultTemplate = this.options.DefaultTemplates[i];

			if (!tmpDefaultTemplate.hasOwnProperty('Postfix') || !tmpDefaultTemplate.hasOwnProperty('Template'))
			{
				this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not load Default Template ${i} in the options array.`, tmpDefaultTemplate);
			}
			else
			{
				if (!tmpDefaultTemplate.Source)
				{
					tmpDefaultTemplate.Source = `PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} options object.`;
				}
				this.fable.TemplateProvider.addDefaultTemplate(tmpDefaultTemplate.Prefix, tmpDefaultTemplate.Postfix, tmpDefaultTemplate.Template, tmpDefaultTemplate.Source);
			}
		}

		// Load all renderables
		// Renderables are launchable renderable instructions with templates
		// They look as such: {Identifier:'ContentEntry', TemplateHash:'Content-Entry-Section-Main', ContentDestinationAddress:'#ContentSection', RecordAddress:'AppData.Content.DefaultText', ManifestTransformation:'ManyfestHash', ManifestDestinationAddress:'AppData.Content.DataToTransformContent'}
		// The only parts that are necessary are Identifier and Template
		// A developer can then do render('ContentEntry') and it just kinda works.  Or they can override the ContentDestinationAddress
		this.renderables = {};
		for (let i = 0; i < this.options.Renderables.length; i++)
		{
			let tmpRenderable = this.options.Renderables[i];

			if (!tmpRenderable.hasOwnProperty('RenderableHash') || !tmpRenderable.hasOwnProperty('TemplateHash'))
			{
				this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not load Renderable ${i} in the options array.`, tmpRenderable);
			}
			else
			{
				this.renderables[tmpRenderable.RenderableHash] = tmpRenderable;
			}
		}
	}

	onBeforeSolve()
	{
		if (this.pict.LogNoisiness > 3)
		{
			this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onBeforeSolve:`);
		}
		return true;
	}
	onBeforeSolveAsync(fCallback)
	{
		this.onBeforeSolve();
		return fCallback();
	}

	onSolve()
	{
		if (this.pict.LogNoisiness > 3)
		{
			this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onSolve:`);
		}
		return true;
	}
	onSolveAsync(fCallback)
	{
		this.onSolve();
		return fCallback();
	}

	solve()
	{
		if (this.pict.LogNoisiness > 2)
		{
			this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} executing solve() function...`);
		}
		this.onBeforeSolve();
		this.onSolve();
		this.onAfterSolve();
		this.lastSolvedTimestamp = this.fable.log.getTimeStamp();
		return true;
	}

	solveAsync(fCallback)
	{
		let tmpAnticipate = this.fable.serviceManager.instantiateServiceProviderWithoutRegistration('Anticipate');

		tmpAnticipate.anticipate(this.onBeforeSolveAsync.bind(this));
		tmpAnticipate.anticipate(this.onSolveAsync.bind(this));
		tmpAnticipate.anticipate(this.onAfterSolve.bind(this));

		tmpAnticipate.wait(
			(pError) =>
			{
				if (this.pict.LogNoisiness > 2)
				{
					this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} solveAsync() complete.`);
				}
				this.lastSolvedTimestamp = this.fable.log.getTimeStamp();
				return fCallback(pError);
			});
	}

	onAfterSolve()
	{
		if (this.pict.LogNoisiness > 3)
		{
			this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onAfterSolve:`);
		}
		return true;
	}
	onAfterSolveAsync(fCallback)
	{
		this.onAfterSolve();
		return fCallback();
	}

	onBeforeInitialize()
	{
		if (this.pict.LogNoisiness > 3)
		{
			this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onBeforeInitialize:`);
		}
		return true;
	}
	onBeforeInitializeAsync(fCallback)
	{
		this.onBeforeInitialize();
		return fCallback();
	}

	onInitialize()
	{

		if (this.pict.LogNoisiness > 3)
		{
			this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onInitialize:`);
		}
		return true;
	}
	onInitializeAsync(fCallback)
	{
		this.onInitialize();
		return fCallback();
	}

	initialize()
	{
		if (!this.initializeTimestamp)
		{
			this.onBeforeInitialize();
			this.onInitialize();
			this.onAfterInitialize();
			this.initializeTimestamp = this.fable.log.getTimeStamp();
			return true;
		}
		else
		{
			this.log.warn(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} initialize called but initialization is already completed.  Aborting.`);
			return false;
		}
	}
	initializeAsync(fCallback)
	{
		if (!this.initializeTimestamp)
		{
			let tmpAnticipate = this.fable.serviceManager.instantiateServiceProviderWithoutRegistration('Anticipate');

			this.log.info(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} beginning initialization...`);

			tmpAnticipate.anticipate(this.onBeforeInitializeAsync.bind(this));
			tmpAnticipate.anticipate(this.onInitializeAsync.bind(this));
			tmpAnticipate.anticipate(this.onAfterInitializeAsync.bind(this));

			tmpAnticipate.wait(
				(pError) =>
				{
					this.initializeTimestamp = this.fable.log.getTimeStamp();
					this.log.info(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} initialization complete.`);
					return fCallback();
				})
		}
		else
		{
			this.log.warn(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} async initialize called but initialization is already completed.  Aborting.`);
			// TODO: Should this be an error?
			return fCallback();
		}
	}

	onAfterInitialize()
	{
		if (this.pict.LogNoisiness > 3)
		{
			this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onAfterInitialize:`);
		}
		return true;
	}
	onAfterInitializeAsync(fCallback)
	{
		this.onAfterInitialize();
		return fCallback();
	}

	onBeforeRender(pRenderable, pRenderDestinationAddress, pData)
	{
		// Overload this to mess with stuff before the content gets generated from the template
		if (this.pict.LogNoisiness > 3)
		{
			this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onBeforeRender:`);
		}
		return true;
	}
	onBeforeRenderAsync(pRenderable, pRenderDestinationAddress, pData, fCallback)
	{
		this.onBeforeRender(pRenderable, pRenderDestinationAddress, pData);
		return fCallback();
	}

	render(pRenderable, pRenderDestinationAddress, pTemplateDataAddress)
	{
		let tmpRenderableHash = (typeof (pRenderable) === 'string') ? pRenderable :
			(typeof (this.options.DefaultRenderable) == 'string') ? this.options.DefaultRenderable : false;
		if (!tmpRenderableHash)
		{
			this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not render ${tmpRenderableHash} (param ${pRenderable}) because it is not a valid renderable.`);
			return false;
		}

		let tmpRenderable = this.renderables[tmpRenderableHash];

		if (!tmpRenderable)
		{
			this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not render ${tmpRenderableHash} (param ${pRenderable}) because it does not exist.`);
			return false;
		}

		let tmpRenderDestinationAddress = (typeof (pRenderDestinationAddress) === 'string') ? pRenderDestinationAddress :
			(typeof (tmpRenderable.ContentDestinationAddress) === 'string') ? tmpRenderable.ContentDestinationAddress :
				(typeof (this.options.DefaultDestinationAddress) === 'string') ? this.options.DefaultDestinationAddress : false;

		if (!tmpRenderDestinationAddress)
		{
			this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not render ${tmpRenderableHash} (param ${pRenderable}) because it does not have a valid destination address.`);
			return false;
		}

		let tmpDataAddress = (typeof (pTemplateDataAddress) === 'string') ? pTemplateDataAddress :
			(typeof (tmpRenderable.RecordAddress) === 'string') ? tmpRenderable.RecordAddress :
				(typeof (this.options.DefaultTemplateRecordAddress) === 'string') ? this.options.DefaultTemplateRecordAddress : false;

		let tmpData = (typeof (tmpDataAddress) === 'string') ? this.fable.DataProvider.getDataByAddress(tmpDataAddress) : undefined;

		// Execute the developer-overridable pre-render behavior
		this.onBeforeRender(tmpRenderable, tmpRenderDestinationAddress, tmpData);

		// Generate the content output from the template and data
		let tmpContent = this.fable.parseTemplateByHash(tmpRenderable.TemplateHash, tmpData)

		// Assign the content to the destination address
		this.fable.ContentAssignment.assignContent(tmpRenderDestinationAddress, tmpContent);

		// Execute the developer-overridable post-render behavior
		this.onAfterRender(tmpRenderable, tmpRenderDestinationAddress, tmpData, tmpContent)

		this.lastRenderedTimestamp = this.fable.log.getTimeStamp();
	}
	renderAsync(pRenderable, pRenderDestinationAddress, pTemplateDataAddress, fCallback)
	{
		let tmpRenderableHash = (typeof (pRenderable) === 'string') ? pRenderable : false;
		if (!tmpRenderableHash)
		{
			this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not asynchronously render ${tmpRenderableHash} (param ${pRenderable}because it is not a valid renderable.`);
			return fCallback(Error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not asynchronously render ${tmpRenderableHash} (param ${pRenderable}because it is not a valid renderable.`));
		}

		let tmpRenderable = this.renderables[tmpRenderableHash];

		if (!tmpRenderable)
		{
			this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not render ${tmpRenderableHash} (param ${pRenderable}) because it does not exist.`);
			return fCallback(Error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not render ${tmpRenderableHash} (param ${pRenderable}) because it does not exist.`));
		}

		let tmpRenderDestinationAddress = (typeof (pRenderDestinationAddress) === 'string') ? pRenderDestinationAddress :
			(typeof (tmpRenderable.ContentDestinationAddress) === 'string') ? tmpRenderable.ContentDestinationAddress :
				(typeof (this.options.DefaultDestinationAddress) === 'string') ? this.options.DefaultDestinationAddress : false;

		if (!tmpRenderDestinationAddress)
		{
			this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not render ${tmpRenderableHash} (param ${pRenderable}) because it does not have a valid destination address.`);
			return fCallback(Error(`Could not render ${tmpRenderableHash}`));
		}

		let tmpDataAddress = (typeof (pTemplateDataAddress) === 'string') ? pTemplateDataAddress :
			(typeof (tmpRenderable.RecordAddress) === 'string') ? tmpRenderable.RecordAddress :
				(typeof (this.options.DefaultTemplateRecordAddress) === 'string') ? this.options.DefaultTemplateRecordAddress : false;

		let tmpData = (typeof (tmpDataAddress) === 'string') ? this.fable.DataProvider.getDataByAddress(tmpDataAddress) : undefined;


		// Execute the developer-overridable pre-render behavior
		this.onBeforeRender(tmpRenderable, tmpRenderDestinationAddress, tmpData);

		// Render the template (asynchronously)
		this.fable.parseTemplateByHash(tmpRenderable.TemplateHash, tmpData,
			(pError, pContent) =>
			{
				if (pError)
				{
					this.log.error(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} could not render (asynchronously) ${tmpRenderableHash} (param ${pRenderable}) because it did not parse the template.`, pError);
					return fCallback(pError);
				}

				// Assign the content to the destination address
				this.fable.ContentAssignment.assignContent(tmpRenderDestinationAddress, pContent);

				// Execute the developer-overridable post-render behavior
				this.onAfterRender(tmpRenderable, tmpRenderDestinationAddress, tmpData, pContent)

				this.lastRenderedTimestamp = this.fable.log.getTimeStamp();

				return fCallback(null, pContent);
			});
	}

	onAfterRender()
	{
		if (this.pict.LogNoisiness > 3)
		{
			this.log.trace(`PictView [${this.UUID}]::[${this.Hash}] ${this.options.ViewIdentifier} onAfterRender:`);
		}
		return true;
	}
	onAfterRenderAsync(fCallback)
	{
		this.onAfterRender();
		return fCallback();
	}
}

module.exports = PictView;
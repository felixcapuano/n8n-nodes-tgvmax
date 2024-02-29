import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	IHttpRequestOptions,
} from 'n8n-workflow';

import { merge } from 'lodash';

export class TGVMax implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TGVMax',
		name: 'tgvmax',
		group: ['input'],
		version: 1,
		description: 'Access tgvmax planner API',
		defaults: {
			name: 'TGVMax',
		},
		inputs: ['main'],
		outputs: ['main'],
		requestDefaults: {
			baseURL: 'https://www.maxjeune-tgvinoui.sncf',
		},
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Search Freeplaces',
						value: 'searchFreeplaces',
					},
				],
				default: 'searchFreeplaces',
			},
			{
				displayName: 'Origin',
				name: 'origin',
				type: 'string',
				placeholder: '',
				description: 'Origin station',
				displayOptions: {
					show: {
						operation: ['searchFreeplaces'],
					},
				},
				default: 'FRLPD',
			},
			{
				displayName: 'Destination',
				name: 'destination',
				type: 'string',
				placeholder: '',
				description: 'Origin station',
				displayOptions: {
					show: {
						operation: ['searchFreeplaces'],
					},
				},
				default: 'FRPLY',
			},
			{
				displayName: 'Departure Date Time',
				name: 'departureDateTime',
				type: 'dateTime',
				placeholder: '',
				description: 'Journey date',
				displayOptions: {
					show: {
						operation: ['searchFreeplaces'],
					},
				},
				default: '2024-02-29T00:00:00',
			},
		],
	};
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		let request: IHttpRequestOptions = {
			baseURL: 'https://www.maxjeune-tgvinoui.sncf',
			url: '',
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
				'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
				Origin: 'https://www.maxjeune-tgvinoui.sncf',
			},
		};

		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation: string = this.getNodeParameter('operation', 0);

		for (let i = 0; i < items.length; i++) {
			try {
				if (operation === 'searchFreeplaces') {
					const departureDateTime = this.getNodeParameter('departureDateTime', i);
					const origin = this.getNodeParameter('origin', i);
					const destination = this.getNodeParameter('destination', i);

					request = merge(request, {
						method: 'POST',
						url: '/api/public/refdata/search-freeplaces-proposals',
						headers: { 'Content-Type': 'application/json' },
						body: { departureDateTime, destination, origin },
					});
				}

				let responseData;
				try {
					responseData = await this.helpers.httpRequest(request);
				} catch (error) {
					if (error.response && error.response.status == 404) {
						responseData = { freePlacesRatio: 0, proposals: [] };
					} else {
						throw error;
					}
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData as IDataObject[]),
					{ itemData: { item: i } },
				);

				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: error.message }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

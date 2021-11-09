const AWS = require('aws-sdk');
AWS.config.update({
    region: 'ap-southeast-1'
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = 'TB_CAMPAIGNS';
const campaignsPath = '/campaigns';
const campaignPath = '/campaign';
const cloudsearchdomain = new AWS.CloudSearchDomain({endpoint: 'doc-smp-nus-campaigns-f2sncfnt5trrpzqefxlvro7aja.ap-southeast-1.cloudsearch.amazonaws.com'});

exports.handler = async function (event, context) {
    
    //API Gateway
    console.log('Request event: ', event);
    let response;
    switch (true) {
        case event.httpMethod === 'GET' && event.path === campaignPath:
            response = await getCampaign(event.queryStringParameters.CAMPAIGNS_ID);
            break;
        case event.httpMethod === 'GET' && event.path === campaignsPath:
            response = await getCampaigns();
            break;
        case event.httpMethod === 'POST' && event.path === campaignPath:
            response = await saveCampaign(JSON.parse(event.body));
            break;
        case event.httpMethod === 'PUT' && event.path === campaignPath:
            response = await updateCampaign(JSON.parse(event.body));
            break;
        case event.httpMethod === 'PATCH' && event.path === campaignPath:
            const requestBody = JSON.parse(event.body);
            response = await modifyCampaign(requestBody.CAMPAIGNS_ID);
            break;
        case event.httpMethod === 'DELETE' && event.path === campaignPath:
            response = await deleteCampaign(JSON.parse(event.body).CAMPAIGNS_ID);
            break;
        default:
            response = buildResponse(404, '404 Not Found');
    }
    
    return response;
}


async function getCampaign(CAMPAIGNS_ID) {
    const params = {
        TableName: dynamodbTableName,
        Key: {
            'CAMPAIGNS_ID': CAMPAIGNS_ID
        }
    }
    return await dynamodb.get(params).promise().then((response) => {
        return buildResponse(200, response.Item);
    }, (error) => {
        console.error('Do your custom error handling here. I am just gonna log it: ', error);
    });
}

async function getCampaigns() {
    const params = {
        TableName: dynamodbTableName
    }
    const allCampaigns = await scanDynamoRecords(params, []);
    const body = {
        campaigns: allCampaigns
    }
    return buildResponse(200, body);
}

async function scanDynamoRecords(scanParams, itemArray) {
    try {
        const dynamoData = await dynamodb.scan(scanParams).promise();
        itemArray = itemArray.concat(dynamoData.Items);
        if (dynamoData.LastEvaluatedKey) {
            scanParams.ExclusiveStartkey = dynamoData.LastEvaluatedKey;
            return await scanDynamoRecords(scanParams, itemArray);
        }
        return itemArray;
    } catch (error) {
        console.error('Do your custom error handling here. I am just gonna log it: ', error);
    }
}

async function saveCampaign(requestBody) {
    const params = {
        TableName: dynamodbTableName,
        Item: requestBody
    }
    return await dynamodb.put(params).promise().then(() => {
        const body = {
            Operation: 'SAVE',
            Message: 'Campaign has been successfully saved.',
            Item: requestBody
        }
        return buildResponse(200, body);
    }, (error) => {
        console.error('Do your custom error handling here. I am just gonna log it: ', error);
    })
}

async function updateCampaign(requestBody) {
    const params = {
        TableName: dynamodbTableName,
        Item: requestBody
    }
    return await dynamodb.put(params).promise().then(() => {
        const body = {
            Operation: 'UPDATE',
            Message: 'Campaign has been successfully updated.',
            Item: requestBody
        }
        return buildResponse(200, body);
    }, (error) => {
        console.error('Do your custom error handling here. I am just gonna log it: ', error);
    })
}

async function modifyCampaign(CAMPAIGNS_ID, updateKey, updateValue) {
    const params = {
        TableName: dynamodbTableName,
        Key: {
            'CAMPAIGNS_ID': CAMPAIGNS_ID
        },
        UpdateExpression: `set ${updateKey} = :value`,
        ExpressionAttributeValues: {
            ':value': updateValue
        },
        ReturnValues: 'UPDATED_NEW'
    }
    return await dynamodb.update(params).promise().then((response) => {
        const body = {
            Operation: 'UPDATE',
            Message: 'Campaign updated successfully.',
            UpdatedAttributes: response
        }
        return buildResponse(200, body);
    }, (error) => {
        console.error('Do your custom error handling here. I am just gonna log it: ', error);
    })
}

async function deleteCampaign(CAMPAIGNS_ID) {
    const params = {
        TableName: dynamodbTableName,
        Key: {
            'CAMPAIGNS_ID': CAMPAIGNS_ID
        },
        ReturnValues: 'ALL_OLD'
    }
    return await dynamodb.delete(params).promise().then((response) => {
        const body = {
            Operation: 'DELETE',
            Message: 'Campaign has been successfully deleted.',
            Item: response
        }
        return buildResponse(200, body);
    }, (error) => {
        console.error('Do your custom error handling here. I am just gonna log it: ', error);
    })
}

function buildResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Headers': 'Access-Control-Allow-Origin,Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,Accept,Origi'	,
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(body)
    }
}

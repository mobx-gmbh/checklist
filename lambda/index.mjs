import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient();
const TABLE = "checklist";
const CORS = {
  "Access-Control-Allow-Origin": "https://mobx-gmbh.github.io",
  "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const VALID_PROFILES = ['khawla', 'jihad'];

export const handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod;
  const path = (event.requestContext?.http?.path || event.path || '').replace(/^\//, '').toLowerCase();

  if (method === "OPTIONS") {
    return { statusCode: 204, headers: CORS };
  }

  if (!VALID_PROFILES.includes(path)) {
    return { statusCode: 400, headers: CORS, body: '{"error":"Invalid profile"}' };
  }

  try {
    if (method === "GET") {
      const res = await db.send(new GetItemCommand({
        TableName: TABLE,
        Key: { pk: { S: path } },
      }));
      const data = res.Item?.payload?.S ? JSON.parse(res.Item.payload.S) : {};
      return { statusCode: 200, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(data) };
    }

    if (method === "PUT") {
      const body = typeof event.body === "string" ? event.body : JSON.stringify(event.body);
      await db.send(new PutItemCommand({
        TableName: TABLE,
        Item: { pk: { S: path }, payload: { S: body } },
      }));
      return { statusCode: 200, headers: CORS, body: '{"ok":true}' };
    }

    return { statusCode: 405, headers: CORS, body: '{"error":"Method not allowed"}' };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};

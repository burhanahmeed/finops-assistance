Mayar Headless API
Get Started

For starting using Mayar Headless API, you need account at https://mayar.id. if you have an account, you can create API KEY from https://web.mayar.id/api-keys. Please dont share your API KEY

We use Basic Auth to Authorization access to our API. it's simple you just set your API KEY for Authorization Barrier on your request Header. For for example please see our Endpoint bellow.

Please note that any changes to your domain or subdomain require you to create a new API KEY so that the link in the response you receive will also be updated.

SANDBOX

For testing purpose, please use https://web.mayar.club/ you can login or register first, after that you can create API KEY from https://web.mayar.club/api-keys.

STATUS CODE

Every request on our API has a response. Every response has satus code. You can know what happen with your reqeust with see resposne status code .

200 - Your request Success

400 - Bad request, your request in complate or you need add required data

404 - Endpoint or Product Dont exist.

401 - You dont have Authorization for access API

429 - Your limit reached

500 - Error

API Base Url

Sanbox

Plain Text
https://api.mayar.club/hl/v1
Production

Plain Text
https://api.mayar.id/hl/v1
Rate Limit

We use rate limit to ensure our API is fast and fair use to all customer. Our Rate Limit at 20 request/minutes.

if you need help or feed back please feel free contact us at info@mayar.id

POST
Deactivate License
https://api.mayar.id/saas/v1/license/deactivate
Deactivate License
This endpoint is used to deactivate a license by providing the license code and product ID.

By performing this action, the status of the license code will change to INACTIVE.

Request Body
licenseCode (string): The license code to be activated.
productId (string): The ID of the product associated with the license.
Response
A successful response will have a statusCode of 200.

statusCode (integer): Indicates the status of the activation process.
message (string): Additional messages related to the deactivation process.
Below is an example of a successfull response body.

json
{
    "statusCode": 200,
    "message": "Success updating license code status to INACTIVE."
}
Below is an example of a failed response body.

json
{
    "statusCode": 400,
    "message": "License code LICENSECODE123 has already inactive."
}
HEADERS
Authorization
Bearer YOUR-TOKEN-API

Body
raw (json)
json
{
    "licenseCode":  "YOUR-LICENSE-CODE",
    "productId":  "YOUR-PRODUCT-ID"
}
Example Request
Deactivate License
curl
curl --location 'https://api.mayar.id/saas/v1/license/deactivate' \
--header 'Authorization: Bearer YOUR-TOKEN-API' \
--data '{
    "licenseCode":  "YOUR-LICENSE-CODE",
    "productId":  "YOUR-PRODUCT-ID"
}'
Example Response
Body
Headers (0)
No response body
This request doesn't return any response body
Membership
GET
Get Membership Member Detail
https://api.mayar.id/hl/v1/membership-member-detail/f5103e7c-9e30-467b-bc32-a96fdcb65849?memberId=PUYSW40N
Get your membership member detail data:

Request Path Params

productId (string)[mandatory]: The unique identifier of the product associated with the credit balance.
Request Query Params

memberId (string)[mandatory]: The unique identifier of the member whose credit balance is being queried.
Response
statusCode (integer): Indicates the status of the activation process.

message (string): Additional messages related to the activation process.

customerEmail (string): Email address of the customer.

customerName (string): Full name of the customer.

customerMobile (string): Mobile phone number of the customer.

status (string): Current status of the customer (e.g., "active").

nextPayment (string): ISO 8601 timestamp (UTC) of the customer's next payment.

expiredAt (string): ISO 8601 timestamp (UTC) of the customer's membership expired.

memberId (string): Membership code associated with the customer.

membershipTierId (string): ID of the customer's membership tier.

membershipTier (object): Details of the customer’s membership tier.

id (string): ID of the membership tier.

name (string): Name of the membership tier.

Below is an example of a successfull response body:

Response example:

View More
Plain Text
{
    "statusCode": 200,
    "messages": "success",
    "data": {
        "customerEmail": "johndoe@gmail.com",
        "customerName": "john doe",
        "customerMobile": "08777777777",
        "status": "active",
        "nextPayment": "2025-11-20T09:10:57.994Z",
        "expiredAt": "2025-11-21T09:10:57.994Z",
        "memberId": "PUYSW40N",
        "membershipTierId": "137f0fa9-8aa5-4fec-947e-6ef223590861",
        "membershipTier": {
            "id": "137f0fa9-8aa5-4fec-947e-6ef223590861",
            "name": "paket 3"
        }
    }
}
HEADERS
Authorization
Bearer Paste-Your-API-Key-Here

PARAMS
memberId
PUYSW40N
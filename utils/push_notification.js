var admin = require("firebase-admin");
const user = require('../modals/login_schema')

var serviceAccount = {
    "type": "service_account",
    "project_id": "learning-df2ab",
    "private_key_id": process.env.firebase_key_id,
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDfugRaDAQDUvDl\nl+Piotvd7iMN5LcMQYgrRRcIgoyl/P2vVUHIeIeta/QlYzli24ZQy42Ygu5lcYhL\nHiYq0K3GJtDR6w1ouVBvk8GiJkAYRvr5c1K4yGQt05QYV6JUDhCFEeZgR9sQnBYo\nmGaK0X8W52SjAEXz22eZon5BducReKcpW2sBdH0V8ElXim19cru5emz691cce1cN\nZKRXEWgb5r9Uiyh7J+EIXIAWxjREWPt6yfNn0oifOo9a3NdDaqCwrDrMy/n2TQaP\nKi20w9btYpqIBUv1tdvCGqb13+xf0x+AGWvOwFuyobTqNobkfjyxlPxAcakaYaqY\nP4xTSIzhAgMBAAECggEAGA7MElV3G6xllIAlfzooDnthxZ1cmbLKTmza3I1n9nQi\ntiH4NZ3QaTOnSLCc0SaYu5jH8dMn3jy70pK8Dp/rWoLTXbS697ybC68wg/E9Cd9I\nHwmUUaPVh0qt2C2ZmmmmGR54Ts4rSQ6fy18SrRwjYHZ4JJcOQ/ofRS7As5Ac/4xt\nuECP65I85+bXqAKP1qZ01j7kdMMjPAHOWaAbmYIFnGPb45/D8UPyat0kzArJ7Npc\nI4LrYuwjy/5qkwqWodG20Z4RTtWcg/pCJF/HGbDhcunbwVqkMWkvCEMX1nd4XGhB\n4Zu4jzaaEgorMQdQsPj1sN5wyyB/IeQah7hENddOyQKBgQDzm6RQ4UWbrTj8RWRN\n49/XZ8no5NzkoNJGXfALq1DEwcQ+moKxjX+uyyGFAAuVB7tIu2OhpZ8e80GKXRSl\n7LpqmBt7D+Q4T1hnchriI2Wl833yVWS3RQm0veKeW8zRkIELtQ9nnbkexcqN/sEY\nhKtPu0pq10+pYLy62cDZddNRhwKBgQDrG3j0V4/mx7qu7QQakS8WU4oz/Qdv03VZ\nNlpTG94eQ3ya2gMnC/sgoMdtvQTyHvzuwzY3MrT5DpPRxHdRs8RDoijZCU0nO+lh\nYpcZoIdRs3h0WmbW2YBHaj3LLca3xBXpS/xmdIchfOyQUWUL2SouKTccEeE7k3UR\naZWu8B9oVwKBgHifsc5GrZP3QwdPSOp0kkrz3nuOj345z8T+ELWGf7jdhVHGaj6G\npRmlBZT4v8Nsj6Tk/OF2xAKsSuC7VFUQkgHkDX9zD/t99nVKf9tH0bZJiiyrcfJ5\noeO4PnVRWWrPVca5QcZ5x8dgAvsqkOyWDMmvIJskwBJLj0gqOJ61BA0TAoGBAKmH\nmNNQJHK8CNBEFlZ15CdMO/a6+NbY+uBGgiE1khfuf/ZFSEqqp/3iEYv+5YcVcztT\nxk9NIBQLP+ndqlBeuSIv1xaRT3IAEIxphB01lP4D1NLJsSgxk/9rC33r10QBf+9H\nHIxgcGRkaUyzdJJzmKfKjnOOLQRBkwPoR8fqXCtnAoGAXQ6qMyV9rFYM0IJIoXxJ\ncIShNI/RluWIs0gGbWOZDGUVTcB2n5DvVNGE0EOFdDuktMTrRVs1Ht9zmz0C1p+9\n+7Y3XzOzmEVnNv2y+6uEpT9acGDMhpJE7INrXnawhCwtRhnVWZZHyiy6J4RpWGVP\nnYQSc8lPawU9OuesEDyGKbw=\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-22q59@learning-df2ab.iam.gserviceaccount.com",
    "client_id": "108961404735333605349",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-22q59%40learning-df2ab.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://learning-df2ab-default-rtdb.firebaseio.com"
});

const push_notification = async (userid, mes) => {

    const tokenid = await user.findOne({ _id: userid }).select('notification_token');
    // console.log("searching token no: ", tokenid);
    const message = {
        notification: {
            title: mes.title,
            body: mes.body,
            image: 'https://res.cloudinary.com/dusxlxlvm/image/upload/v1709654642/battlefiesta/assets/logo/logopng250_vuhy4f.webp',
            url:"www.youtube.com"
        },
        data:{
            url:'https://accusoft.vercel.app/addexpense'
        },
        token: tokenid.notification_token,
        // token: 'dUyPxIb4efRoaCZIabYf-j:APA91bHk-eukFaKZKEQ9a6_TX5rJhQ6larnlBUtlJ6jsIi-qpZPjfG_TPlU114O9dfhynCxSMdpaDqNTw1-jGR-NQtgUo74LgygZrG-2FNXGyuyKpozIJ5PcKdYKuIn0E_Yuu5VHFsbR',
    };

    await admin.messaging().send(message)
        .then((response) => {
            console.log('Push Notification sent:', response);
        })
        .catch((error) => {
            console.error('Push Notification Error:', error);
        });
}
module.exports = push_notification;


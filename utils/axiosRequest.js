const axios = require('axios');

async function addtoqueue(email, title, body) {
    try {
        const response = await axios.post('http://65.1.97.111:5001/producer', {
            // Your request payload/data here
            email, title, body
        });
        console.log('Response from axiosRequest:', response.data);
        return true;
    } catch (error) {
        console.error('Error:', error.message);
        return false;
    }
}

// Call the function to send the POST request
module.exports = {addtoqueue};

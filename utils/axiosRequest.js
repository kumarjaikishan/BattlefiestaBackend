const axios = require('axios');

async function addtoqueue(email, title, body) {
    try {
        // const response = await axios.post('http://sw.battlefiesta.in/producer', {
        const response = await axios.post('http://localhost:5001/producer', {
            email, title, body
        });
        console.log('Response from axiosRequest:', response.data);
        return true;
    } catch (error) {
        console.error('Error:', error.message);
        return false;
    }
}


module.exports = {addtoqueue};

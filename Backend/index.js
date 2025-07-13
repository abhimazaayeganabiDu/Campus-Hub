import app from "./src/app.js"
import {port} from "./src/constant/auth.constants.js"

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
})
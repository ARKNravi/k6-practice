import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";

// Custom Metrics
let loginDuration = new Trend("login_duration", true);
let createDuration = new Trend("create_duration", true);
let updateDuration = new Trend("update_duration", true);
let patchDuration = new Trend("patch_duration", true);
let deleteDuration = new Trend("delete_duration", true);

let successCounter = new Counter("successful_requests");
let failureRate = new Rate("failed_requests");

export let options = {
    stages: [
        { duration: "30s", target: 5 }, // Ramp-up to 5 VUs
        { duration: "30s", target: 5 }, // Stay at 5 VUs
        { duration: "30s", target: 0 }, // Ramp-down to 0 VUs
    ],
};

const BASE_URL = "https://test-api.k6.io";
const USERNAME = "arknravi"; // Replace with your username
const PASSWORD = "workshopbe"; // Replace with your password

export default function () {
    // 1. Login and obtain the access token
    let loginRes = http.post(`${BASE_URL}/auth/token/login/`, {
        username: USERNAME,
        password: PASSWORD,
    });

    // Record login duration
    loginDuration.add(loginRes.timings.duration);

    // Check if login was successful
    let loginSuccess = check(loginRes, {
        "login successful": (resp) =>
            resp.status === 200 && resp.json("access") !== "",
    });

    if (!loginSuccess) {
        failureRate.add(1);
        console.error("Login failed");
        return;
    } else {
        successCounter.add(1);
    }

    let token = loginRes.json("access");

    let authHeaders = {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    };

    // 2. Create a new crocodile (POST)
    let createPayload = JSON.stringify({
        name: `Crocodile ${__VU}-${__ITER}`,
        sex: "M",
        date_of_birth: "2001-01-01",
    });

    let createRes = http.post(`${BASE_URL}/my/crocodiles/`, createPayload, {
        headers: authHeaders.headers,
        tags: { endpoint: "CreateCrocodile", method: "POST" },
    });

    // Record create duration
    createDuration.add(createRes.timings.duration);

    let createSuccess = check(createRes, {
        "created crocodile": (resp) => resp.status === 201,
    });

    if (!createSuccess) {
        failureRate.add(1);
        console.error("Create crocodile failed");
        return;
    } else {
        successCounter.add(1);
    }

    let crocodileId = createRes.json("id");

    // 3. Update the crocodile (PUT)
    let updatePayload = JSON.stringify({
        name: `Updated Crocodile ${__VU}-${__ITER}`,
        sex: "F",
        date_of_birth: "2002-02-02",
    });

    let updateRes = http.put(
        `${BASE_URL}/my/crocodiles/${crocodileId}/`,
        updatePayload,
        {
            headers: authHeaders.headers,
            tags: { endpoint: "UpdateCrocodile", method: "PUT" },
        }
    );

    // Record update duration
    updateDuration.add(updateRes.timings.duration);

    let updateSuccess = check(updateRes, {
        "updated crocodile": (resp) => resp.status === 200,
    });

    if (!updateSuccess) {
        failureRate.add(1);
        console.error("Update crocodile failed");
    } else {
        successCounter.add(1);
    }

    // 4. Patch the crocodile (PATCH)
    let patchPayload = JSON.stringify({
        name: `Patched Crocodile ${__VU}-${__ITER}`,
    });

    let patchRes = http.patch(
        `${BASE_URL}/my/crocodiles/${crocodileId}/`,
        patchPayload,
        {
            headers: authHeaders.headers,
            tags: { endpoint: "PatchCrocodile", method: "PATCH" },
        }
    );

    // Record patch duration
    patchDuration.add(patchRes.timings.duration);

    let patchSuccess = check(patchRes, {
        "patched crocodile": (resp) => resp.status === 200,
    });

    if (!patchSuccess) {
        failureRate.add(1);
        console.error("Patch crocodile failed");
    } else {
        successCounter.add(1);
    }

    // 5. Delete the crocodile (DELETE)
    let deleteRes = http.del(
        `${BASE_URL}/my/crocodiles/${crocodileId}/`,
        null,
        {
            headers: authHeaders.headers,
            tags: { endpoint: "DeleteCrocodile", method: "DELETE" },
        }
    );

    // Record delete duration
    deleteDuration.add(deleteRes.timings.duration);

    let deleteSuccess = check(deleteRes, {
        "deleted crocodile": (resp) => resp.status === 204,
    });

    if (!deleteSuccess) {
        failureRate.add(1);
        console.error("Delete crocodile failed");
    } else {
        successCounter.add(1);
    }

    sleep(1);
}

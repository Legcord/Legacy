const {
    flux: {dispatcher}
} = shelter;

function notificationCreate(data) {
    console.log(data);
    window.legcord.displayBalloon(data.title, data.body);
}

export function onLoad() {
    dispatcher.subscribe("RPC_NOTIFICATION_CREATE", notificationCreate);
}

export function onUnload() {
    dispatcher.unsubscribe("RPC_NOTIFICATION_CREATE", notificationCreate);
}

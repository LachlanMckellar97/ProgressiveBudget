const request = window.indexedDB.open("budget", 1);
var db;
// Create schema
request.onupgradeneeded = event => {
  db = event.target.result;
  db.createObjectStore("waiting", {
    autoIncrement: true
  });

};

request.onsuccess = (event) => {
  db = event.target.result;
  if (navigator.onLine) {
    getDbItems();
  }
};

function saveRecord(item) {
  const transaction = db.transaction(["waiting"], "readwrite");
  const budgetStore = transaction.objectStore("waiting");
  budgetStore.add(item);
}

function getDbItems() {
  const transaction = db.transaction(["waiting"], "readwrite");
  const budgetStore = transaction.objectStore("waiting");
  const items = budgetStore.getAll();
  items.onsuccess = function () {
    // if the db is done being read
    console.log(items.result);
    if (items.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(items.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        } 
      })
        .then(res => {
          return res.json();
        })
        .then(() => {
          const transaction = db.transaction(["waiting"], "readwrite");
          const budgetStore = transaction.objectStore("waiting");
          budgetStore.clear();
        });
    }
  }
}

// when back online, check for new data in db
window.addEventListener("online", getDbItems)
document.getElementById('actionDropdown').addEventListener('change', function() {
    const selectedAction = this.value;
    switch (selectedAction) {
        case 'createTrack':
            createTrack();
            break;
        case 'saveTracks':
            saveTracksToFirestore();
            break;
        case 'loadTracks':
            loadTracksFromFirestore();
            break;
        case 'deleteTrack':
            deleteTrack();
            break;
        case 'showStatistics': 
            displayStatistics();
            break;
    }

    
    this.value = '0';
});

let touchStartX = null;
let touchStartY = null;
let isDragging = false;
let firebaseConfig, db, tracks = [], currentDraggingWagon = null, selectedWagonForSwap = null;
let markedWagons = [];
let doubleClickTimeout = null;
let isDoubleClick = false;
let longPressTimer = null;
let tapCount = 0;
let tapTimeout = null;
let lastHighlightedWagon = null;
let lastHighlightedWagonOriginalColor = null;
let foundWagons = [];
let currentWagonIndex = 0;

window.onload = function() {
    firebaseConfig = {
        apiKey: "AIzaSyDcnFOD2qf58RpCL3ULpkCBMGMuvaTMqcw",
        authDomain: "railradar-7653f.firebaseapp.com",
        projectId: "railradar-7653f",
        storageBucket: "railradar-7653f.appspot.com",
        messagingSenderId: "704918244072",
        appId: "1:704918244072:web:4311fece81040bcf38175d",
        measurementId: "G-7FHG4BD4W0"
    };

    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    
	getAllWagonsCount().then(total => {
    console.log("Gesamtzahl der Waggons: ", total);
    }).catch(error => {
    console.error("Ein Fehler ist aufgetreten: ", error);
});
	

const currentDocumentRef = db.collection("tracks").doc("current");


currentDocumentRef.get().then((doc) => {
    if (doc.exists) {
        console.log("Current document data:", doc.data());
    } else {
        console.log("No such document!");
    }
}).catch((error) => {
    console.log("Error getting document:", error);
});




    
    document.getElementById("btnSearchWagon").addEventListener('click', searchWagon);
    document.getElementById("btnDeleteWagon").addEventListener('click', deleteWagon);
    document.getElementById("btnMoveMarkedWagons").addEventListener('click', moveMarkedWagons);
    document.getElementById("btnMoveMarkedWagonsToPosition").addEventListener('click', moveMarkedWagonsToPosition);
    document.getElementById("btnSetWagonToAbgestellt").addEventListener('click', toggleWagonsAbgestelltStatus);
    document.getElementById('btnShowStatistics').addEventListener('click', displayStatistics);
	loadTracksFromFirestore();
};


document.getElementById('legendButton').addEventListener('click', function() {
    document.getElementById('legendModal').style.display = 'block';
});


document.getElementById('legendModal').addEventListener('click', function() {
    document.getElementById('legendModal').style.display = 'none';
});

document.querySelector('.modal-content').addEventListener('click', function(event) {
    event.stopPropagation();
});


document.getElementById('statusModal').addEventListener('click', function() {
    document.getElementById('statusModal').style.display = 'none';
});

        
document.querySelector('#statusModal > div').addEventListener('click', function(event) {
    event.stopPropagation();
});

document.addEventListener("DOMContentLoaded", function() {
	var modal = document.getElementById("modalMenu");
	var btn = document.getElementById("openModalButton");
	var span = document.getElementsByClassName("close-button")[0];

	btn.onclick = function(event) {
    console.log("Wagon Daten Button wurde geklickt");
    event.stopPropagation();
    modal.style.display = "block";
	}

	span.onclick = function() {
    console.log("Schließen Button wurde geklickt");
    modal.style.display = "none";
	}

	window.onclick = function(event) {
    console.log("Klick außerhalb eines Modals");
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
});

document.addEventListener("DOMContentLoaded", function() {
    const actionDropdown = document.getElementById('actionDropdown');

    if(actionDropdown) {
        actionDropdown.addEventListener('change', function() {
            const selectedAction = this.value;

            switch(selectedAction) {
                case 'showStatistics':
                    displayStatistics();
                    this.value = "0"; 
                    break;
                
                
                default:
                    break;
            }
        });
    }
});



function showWagonDataModal() {
    var wagonDataModal = document.getElementById("WagonDataModal");
    wagonDataModal.style.display = "block";
}



function getAllWagonsCount() {
    return db.collection("tracks").doc("current").get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.tracks && Array.isArray(data.tracks)) {
                let totalWagons = 0;
                data.tracks.forEach(track => {
                    if (track.wagons && Array.isArray(track.wagons)) {
                        totalWagons += track.wagons.length;
                    }
                });
                return totalWagons;
            }
        }
        return 0;
    });
}

function getReadyForExitWagonsCount() {
    let count = 0;

    return db.collection("tracks").doc("current").get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.tracks && Array.isArray(data.tracks)) {
                data.tracks.forEach(track => {
                    if (track.wagons && Array.isArray(track.wagons)) {
                        track.wagons.forEach(wagon => {
                            if (wagon.status === "Ausgang") {
                                count++;
                            }
                        });
                    }
                });
            }
        }
        return count;
    });
}

function getWorkshopWagonsCount() {
    let count = 0;

    return db.collection("tracks").doc("current").get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.tracks && Array.isArray(data.tracks)) {
                data.tracks.forEach(track => {
                    if (track.wagons && Array.isArray(track.wagons)) {
                        track.wagons.forEach(wagon => {
                            if (wagon.status === "Werkstatt") {
                                count++;
                            }
                        });
                    }
                });
            }
        }
        return count;
    });
}



function getAbgestelltWagonsCount() {
    let count = 0;

    return db.collection("tracks").doc("current").get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.tracks && Array.isArray(data.tracks)) {
                data.tracks.forEach(track => {
                    if (track.wagons && Array.isArray(track.wagons)) {
                        track.wagons.forEach(wagon => {
                            if (wagon.abgestellt === true) {  
                                count++;
                            }
                        });
                    }
                });
            }
        }
        return count;
    });
}

function getCleaningWagonsCount() {
    let count = 0;

    return db.collection("tracks").doc("current").get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.tracks && Array.isArray(data.tracks)) {
                data.tracks.forEach(track => {
                    if (track.wagons && Array.isArray(track.wagons)) {
                        track.wagons.forEach(wagon => {
                            if (wagon.status === "Reinigung") {
                                count++;
                            }
                        });
                    }
                });
            }
        }
        return count;
    });
}

function openStatisticsModal() {
    document.getElementById('statisticsModal').style.display = "block";
}

function closeStatisticsModal() {
    document.getElementById('statisticsModal').style.display = "none";
}


document.querySelector('.close-btn').addEventListener('click', closeStatisticsModal);

let currentTrackIndex = null;

function adjustMarkedWagonsSpacing() {
    if (markedWagons.length === 0) {
        alert("Bitte markieren Sie zuerst die Wagons.");
        return;
    }

    for (let i = 0; i < markedWagons.length; i++) {
        const [trackIndex, wagonIndex] = markedWagons[i].split('-').map(Number);
        const track = tracks[trackIndex];
        const wagon = track.wagons[wagonIndex];

        
        if (wagon.markedSpacing) {
            delete wagon.markedSpacing;
        } else {
            wagon.markedSpacing = 50;
        }
    }

    
    markedWagons = [];

    displayTracks();
    saveTracksToFirestore();
}

function setWagonsToWorkshop() {
    if (markedWagons.length === 0) {
        alert("Bitte mindestens einen Wagen auswählen.");
        return;
    }

    markedWagons.forEach(markedWagon => {
        const [trackIndex, wagonIndex] = markedWagon.split('-').map(Number);
        let selectedWagon = tracks[trackIndex].wagons[wagonIndex];

        if (selectedWagon.status === 'Werkstatt') {
            selectedWagon.status = 'Aktiv';
            delete selectedWagon.originalPosition;
        } else {
            selectedWagon.status = 'Werkstatt';
            selectedWagon.originalPosition = selectedWagon.position;
            selectedWagon.position = null;
        }

        updateWagonPositions(trackIndex);
    });

    displayTracks();
    saveTracksToFirestore();
}

function toggleWagonsAbgestelltStatus() {
    if (markedWagons.length === 0) {
        alert("Bitte mindestens einen Wagen auswählen.");
        return;
    }
    document.getElementById('statusModal').style.display = 'block';
}


const availableColors = [
    'black', 'blue', 'green', 'purple', 'orange', 'brown', 'pink', 'cyan', 'magenta', 'yellow', 'lime',
    'navy', 'darkgreen', 'indigo', 'darkorange', 'teal', 'darkviolet', 'beige', 'darkblue',
    'darkcyan', 'darkmagenta', 'darkolivegreen', 'darkorchid', 'darksalmon', 'darkseagreen', 'darkslateblue',
    'darkturquoise', 'darkgoldenrod', 'deepskyblue', 'forestgreen', 'fuchsia', 'gold',
    'hotpink', 'khaki', 'lavender', 'lightblue', 'lightcoral', 'lightgreen', 'lightpink',
    'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray', 'lightsteelblue', 'mediumblue', 'mediumorchid',
    'mediumpurple', 'mediumseagreen', 'mediumslateblue', 'mediumspringgreen', 'mediumturquoise', 'mediumvioletred',
    'midnightblue', 'olive', 'olivedrab', 'orchid', 'palegreen', 'paleturquoise', 'palevioletred',
    'peru', 'plum', 'powderblue', 'rosybrown', 'royalblue', 'saddlebrown', 'sandybrown', 'seagreen',
    'sienna', 'silver', 'skyblue', 'slateblue', 'springgreen', 'steelblue', 'tan', 'thistle',
    'turquoise', 'violet', 'wheat'
];

function getNextAvailableColor() {
    const usedColors = new Set();
    tracks.forEach(track => {
        track.wagons.forEach(wagon => {
            if (wagon.isCoupled && wagon.couplingColor) {
                usedColors.add(wagon.couplingColor);
            }
        });
    });

    for (const color of availableColors) {
        if (!usedColors.has(color)) {
            return color;
        }
    }

    return 'black';
}

document.getElementById('setStatusAbgestellt').addEventListener('click', function() {
    changeWagonStatus('abgestellt');
    document.getElementById('statusModal').style.display = 'none';
});

document.getElementById('setStatusAusgang').addEventListener('click', function() {
    changeWagonStatus('Ausgang');
    document.getElementById('statusModal').style.display = 'none';
});

document.getElementById('setStatusWerkstatt').addEventListener('click', function() {
    changeWagonStatus('Werkstatt');
    document.getElementById('statusModal').style.display = 'none';
});

document.getElementById('setStatusReinigung').addEventListener('click', function() {
    changeWagonStatus('Reinigung');
    document.getElementById('statusModal').style.display = 'none';
});

document.getElementById('setStatusKoppeln').addEventListener('click', function() {
    changeWagonStatus('Koppeln');
    document.getElementById('statusModal').style.display = 'none';
});


let wagon = {
    name: "Wagon1",
    isCoupled: false,
    couplingGroup: null,
    
};

let couplingGroupCounter = 1;

function addSuffixOnce(string, suffix) {
    if (!string.endsWith(suffix)) {
        return string + suffix;
    }
    return string;
}

function removeSuffix(string, suffix) {
    if (string.endsWith(suffix)) {
        return string.slice(0, -suffix.length);
    }
    return string;
}


function sanitizePosition(position, update) {
    while (typeof position === 'string' && position.includes(update + update)) {
        position = position.replace(update + update, update);
    }
    return position;
}


function changeWagonStatus(action) {
    if (markedWagons.length === 0) {
        alert("Bitte mindestens einen Wagen auswählen.");
        return;
    }

    markedWagons.forEach(markedWagon => {
        const [trackIndex, wagonIndex] = markedWagon.split('-').map(Number);
        let selectedWagon = tracks[trackIndex].wagons[wagonIndex];
        let originalStatus = selectedWagon.status;

        if (action === 'Koppeln') {
            return;
        }

        if (action === originalStatus) {
            selectedWagon.status = 'Aktiv';
            selectedWagon.position = wagonIndex + 1;
        } else {
            selectedWagon.status = action;
            if (action === 'Werkstatt') {
                selectedWagon.position = null;
            } else {
                selectedWagon.position = wagonIndex + 1;
            }
        }

        if (action === 'Werkstatt' || originalStatus === 'Werkstatt') {
            let newPosition = 1;
            tracks[trackIndex].wagons.forEach((wagon) => {
                if (wagon.status !== 'Werkstatt') {
                    wagon.position = newPosition++;
                }
            });
        }

        if (action === 'abgestellt') {
            selectedWagon.abgestellt = !selectedWagon.abgestellt;
            if (selectedWagon.abgestellt) {
                selectedWagon.status = ''; 
            } else {
                selectedWagon.position = wagonIndex + 1;
            }
        }

        if (action !== 'abgestellt') {
            selectedWagon.abgestellt = false; 
        }
    });

    displayTracks();
    saveTracksToFirestore();
    markedWagons = [];
}


function displayStatistics() {
    Promise.all([getAllWagonsCount(), getWorkshopWagonsCount(), getAbgestelltWagonsCount(), getReadyForExitWagonsCount(), getCleaningWagonsCount()]).then(values => {
        let totalWagons = values[0];
        let workshopWagons = values[1];
        let abgestelltWagons = values[2];
        let readyForExitWagons = values[3];
        let cleaningWagons = values[4];

        let auslastung = ((totalWagons / 130) * 100).toFixed(2); 

        let message = `
        <p>Wagons im Werk: ${totalWagons}</p>
        <p>Auslastung des Werks: ${auslastung}%</p>
        <p>Wagons in der Werkstatt: ${workshopWagons}</p>
        <p>Wagons abgestellt: ${abgestelltWagons}</p>
        <p>Wagons bereit für den Ausgang: ${readyForExitWagons}</p>
        <p>Wagons die gereinigt werden: ${cleaningWagons}</p>
        <p>Mögliche zusätzliche Wagons: ${130 - totalWagons}</p>`; 
                      
        document.getElementById('statisticsContent').innerHTML = message;
        openStatisticsModal(); 
    });
}



function drag(event) {
    touchStartX = event.clientX || (event.pointers && event.pointers[0] ? event.pointers[0].clientX : null);
    touchStartY = event.clientY || (event.pointers && event.pointers[0] ? event.pointers[0].clientY : null);

    isDragging = true;
    currentDraggingWagon = {
        wagonElement: event.target,
        wagonIndex: event.target.getAttribute('data-wagon-index'),
        trackIndex: event.target.getAttribute('data-track-index')
    };
    event.target.classList.add('ready-to-drag');

    
    event.target.style.boxShadow = '0px 0px 15px rgba(0,0,0,0.4)';
}


function swapWagons(wagon1, wagon2) {
    
    if (markedWagons.includes(`${wagon1.trackIndex}-${wagon1.wagonIndex}`) || markedWagons.includes(`${wagon2.trackIndex}-${wagon2.wagonIndex}`)) return;

    const temp = tracks[wagon1.trackIndex].wagons[wagon1.wagonIndex];
    tracks[wagon1.trackIndex].wagons[wagon1.wagonIndex] = tracks[wagon2.trackIndex].wagons[wagon2.wagonIndex];
    tracks[wagon2.trackIndex].wagons[wagon2.wagonIndex] = temp;

    updatePositions(tracks[wagon1.trackIndex]);
    updatePositions(tracks[wagon2.trackIndex]);

    displayTracks();
    saveTracksToFirestore();
}

function touchMoveHandler(event) {
    if (isDragging) {
        const dx = event.srcEvent.clientX - touchStartX;
        const dy = event.srcEvent.clientY - touchStartY;

        currentDraggingWagon.wagonElement.style.transform = `scale(1.05) translate(${dx}px, ${dy}px)`;
    }
}


function drop(event) {
    if (isDragging && currentDraggingWagon) {
        const fromTrack = tracks[currentDraggingWagon.trackIndex];
        const toTrackElement = getTrackElementFromChild(event.target);
        const toTrackIndex = toTrackElement.getAttribute('data-track-index');
        const toTrack = tracks[toTrackIndex];

        const wagon = fromTrack.wagons[currentDraggingWagon.wagonIndex];

        
        if (wagon.status === 'Werkstatt') {
            isDragging = false;
            tapCount = 0;
            event.target.style.transform = '';
            event.target.classList.remove('ready-to-drag');
            return; 
        }

        fromTrack.wagons.splice(currentDraggingWagon.wagonIndex, 1);
        toTrack.wagons.push(wagon);

        updatePositions(fromTrack);
        updatePositions(toTrack);

        displayTracks();
        saveTracksToFirestore();

        currentDraggingWagon = null;
    }
    isDragging = false;
    tapCount = 0;

    event.target.style.transform = '';
    event.target.classList.remove('ready-to-drag');
}


function getTrackElementFromChild(childElem) {
    let currentElem = childElem;
    while (currentElem && !currentElem.classList.contains('track')) {
        currentElem = currentElem.parentElement;
    }
    return currentElem;
}

function handleSingleClick(event) {
    if (doubleClickTimeout !== null) {
        clearTimeout(doubleClickTimeout);
        doubleClickTimeout = null;

        
        selectedWagonForSwap = {
            wagonIndex: event.target.getAttribute('data-wagon-index'),
            trackIndex: event.target.getAttribute('data-track-index')
        };
        isDoubleClick = true;

        
        event.target.style.backgroundColor = 'blue'; 
    } else {
        doubleClickTimeout = setTimeout(() => {
            if (selectedWagonForSwap) {
                const selectedWagonElement = document.querySelector(`[data-track-index='${selectedWagonForSwap.trackIndex}'][data-wagon-index='${selectedWagonForSwap.wagonIndex}']`);
                if (selectedWagonElement) {
                    
                    selectedWagonElement.style.backgroundColor = ''; 
                }
                swapWagons(selectedWagonForSwap, {
                    wagonIndex: event.target.getAttribute('data-wagon-index'),
                    trackIndex: event.target.getAttribute('data-track-index')
                });
                selectedWagonForSwap = null;
            } else {
                if (!isDoubleClick) {
                    markWagon(event);
                }
            }
            isDoubleClick = false;
            doubleClickTimeout = null;
        }, 500);
    }
}

function markWagon(event) {
    const wagonDiv = event.target;
    const wagonIndex = wagonDiv.getAttribute('data-wagon-index');
    const trackIndex = wagonDiv.getAttribute('data-track-index');
    const markedId = `${trackIndex}-${wagonIndex}`;
    const selectedWagon = tracks[trackIndex].wagons[wagonIndex];

    if (markedWagons.includes(markedId)) {
        
        if (selectedWagon.status === 'Werkstatt') {
            wagonDiv.style.backgroundColor = 'purple'; 
        } else if (selectedWagon.abgestellt) {
            wagonDiv.style.backgroundColor = 'orange'; 
        } else if (selectedWagon.status === 'Reinigung') {
            wagonDiv.style.backgroundColor = 'turquoise';
		} else if (selectedWagon.status === 'Ausgang') {
            wagonDiv.style.backgroundColor = 'pink';  
        } else {
            wagonDiv.style.backgroundColor = 'red'; 
        }
        const index = markedWagons.indexOf(markedId);
        markedWagons.splice(index, 1);
    } else {
        wagonDiv.style.backgroundColor = 'green';
        markedWagons.push(markedId);
    }
}

function startLongPress(event) {
    longPressTimer = setTimeout(() => {
        markWagon(event);
    }, 500);  
}

function cancelLongPress() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

function uncoupleWagons(wagonsToMove, couplingGroups) {
    
    if (!Array.isArray(couplingGroups)) {
        console.error("Ungültiger Wert für couplingGroups:", couplingGroups);
        return;
    }

    console.log("Vor dem Entkoppeln:", JSON.stringify(couplingGroups));

    for (let i = 0; i < couplingGroups.length; i++) {
        let group = couplingGroups[i];
        let intersection = group.filter(wagon => wagonsToMove.includes(wagon));

        
        if (intersection.length === group.length) {
            continue;
        }

        
        if (intersection.length > 0 && intersection.length < group.length) {
            couplingGroups.splice(i, 1);
            couplingGroups.push(intersection);
            couplingGroups.push(group.filter(wagon => !wagonsToMove.includes(wagon)));
        }
    }

    console.log("Nach dem Entkoppeln:", JSON.stringify(couplingGroups));
}

function moveMarkedWagons() {
    if (markedWagons.length === 0) {
        alert("Bitte markieren Sie zuerst die Wagons, die Sie verschieben möchten.");
        return;
    }

    const trackName = prompt("Auf welches Gleis möchten Sie die Wagons verschieben?");
    const track = tracks.find(t => t.name === trackName);

    if (!track) {
        alert(`Das Gleis ${trackName} wurde nicht gefunden.`);
        return;
    }

    let wagonsToMove = [];
    let affectedTracks = new Set();
    markedWagons.forEach(markedId => {
        const [trackIndex, wagonIndex] = markedId.split('-').map(Number);
        affectedTracks.add(trackIndex);
        const wagon = tracks[trackIndex].wagons[wagonIndex];
        wagonsToMove.push(wagon);
    });

    let uniqueColors = new Set(wagonsToMove.map(wagon => wagon.couplingColor));
    if (uniqueColors.size > 1 || wagonsToMove.length === 1) {
        wagonsToMove.forEach(wagon => {
            wagon.isCoupled = false;
            wagon.couplingGroup = null;
            wagon.couplingColor = null;
        });
    }

    wagonsToMove.forEach(wagon => {
        for (let i = 0; i < tracks.length; i++) {
            const index = tracks[i].wagons.indexOf(wagon);
            if (index > -1) {
                tracks[i].wagons.splice(index, 1);
                break;
            }
        }
    });

    track.wagons.push(...wagonsToMove);

    affectedTracks.forEach(trackIndex => {
        updatePositions(tracks[trackIndex]);
    });

    updatePositions(track);

    displayTracks();
    saveTracksToFirestore();

    markedWagons = [];
}



function moveMarkedWagonsToPosition() {
    if (markedWagons.length === 0) {
        alert("Bitte markieren Sie zuerst die Wagons, die Sie verschieben möchten.");
        return;
    }

    const trackName = prompt("Auf welches Gleis möchten Sie die Wagons verschieben?");
    const track = tracks.find(t => t.name === trackName);

    if (!track) {
        alert(`Das Gleis ${trackName} wurde nicht gefunden.`);
        return;
    }

    const position = parseInt(prompt("An welche Position möchten Sie den ersten der markierten Wagons verschieben?"));

    if (!position || isNaN(position) || position < 1 || position > track.wagons.length + 1) {
        alert("Ungültige Position eingegeben.");
        return;
    }

    let wagonsToMove = [];
    let affectedTracks = new Set();
    markedWagons.forEach(markedId => {
        const [trackIndex, wagonIndex] = markedId.split('-').map(Number);
        affectedTracks.add(trackIndex);
        const wagon = tracks[trackIndex].wagons[wagonIndex];
        wagonsToMove.push(wagon);
    });

    
    wagonsToMove.forEach(wagon => {
        wagon.isCoupled = false;
        wagon.couplingGroup = null;
        wagon.couplingColor = null;
    });

    wagonsToMove.forEach(wagon => {
        for (let i = 0; i < tracks.length; i++) {
            const index = tracks[i].wagons.indexOf(wagon);
            if (index > -1) {
                tracks[i].wagons.splice(index, 1);
                break;
            }
        }
    });

    track.wagons.splice(position - 1, 0, ...wagonsToMove);

    affectedTracks.forEach(trackIndex => {
        updatePositions(tracks[trackIndex]);
    });

    updatePositions(track);

    displayTracks();
    saveTracksToFirestore();

    markedWagons = [];
}

function displayTracks() {
    const tracksDiv = document.getElementById("tracks");
    tracksDiv.innerHTML = '';

    tracks.forEach((track, trackIndex) => {
        let trackDiv = document.createElement('div');
        trackDiv.className = 'track';
        trackDiv.setAttribute('data-track-index', trackIndex);

        trackDiv.style.backgroundColor = 'gray'; 

        let titleStartDiv = document.createElement('div');
        if ('startLabel' in track) {
            titleStartDiv.innerText = track.startLabel ? `${track.startLabel} | Gleis: ${track.name}` : `Gleis: ${track.name}`;
        } else {
            titleStartDiv.innerText = `Feuerwehr Seite | Gleis: ${track.name}`;
        }
        trackDiv.appendChild(titleStartDiv);

        let titleEndDiv = document.createElement('div');
        if ('endLabel' in track) {
            if (track.endLabel) {
                titleEndDiv.innerText = track.endLabel;
            }
        } else {
            titleEndDiv.innerText = "Duisport Seite";
        }
        titleEndDiv.className = 'duisport-label';
        trackDiv.appendChild(titleEndDiv);

        let createWagonButton = document.createElement('button');
        createWagonButton.innerText = 'Wagon erstellen';
        createWagonButton.onclick = () => createWagon(trackIndex);
        trackDiv.appendChild(createWagonButton);

        let sortedWagons = track.wagons.sort((a, b) => (a.position || 9999) - (b.position || 9999));

        sortedWagons.forEach((wagon, wagonIndex) => {
            let wagonDiv = document.createElement('div');
            wagonDiv.className = 'wagon';

            if (wagon.isCoupled && wagon.couplingColor) {
                wagonDiv.style.border = `4px solid ${wagon.couplingColor}`;
            }

            if (wagon.status === 'Werkstatt') {
				wagonDiv.style.backgroundColor = 'purple'; 
			} else if (wagon.status === 'Reinigung') {
			    wagonDiv.style.backgroundColor = 'turquoise'; 
			} else if (wagon.status === 'Ausgang') {
				wagonDiv.style.backgroundColor = 'pink'; 
			} else if (wagon.abgestellt) {
				wagonDiv.style.backgroundColor = 'orange'; 
			    console.log("Orange Farbe gesetzt für:", wagon);
			} else {
				wagonDiv.style.backgroundColor = 'red'; 
			}

            let positionText = wagon.position ? ` (${wagon.position}${wagon.abgestellt ? '*' : wagon.status === 'Ausgang' ? 'A' : wagon.status === 'Reinigung' ? 'R' : ''})` : '';
            wagonDiv.innerHTML = `${wagon.name}${positionText}`;

            wagonDiv.draggable = true;
            wagonDiv.setAttribute('data-wagon-index', wagonIndex);
            wagonDiv.setAttribute('data-track-index', trackIndex);
            wagonDiv.setAttribute('id', `track-${trackIndex}-wagon-${wagonIndex}`); 
            wagonDiv.ondragstart = drag;
            wagonDiv.onclick = handleSingleClick;

            trackDiv.appendChild(wagonDiv);
        });

        tracksDiv.appendChild(trackDiv);
    });
}

function allowDrop(event) {
    event.preventDefault();
}

function createTrack() {
    const trackName = prompt("Wie soll das Gleis benannt werden?");
    if (trackName) {
        const startLabel = prompt("Möchten Sie den Anfang des Gleises benennen? (Leer lassen, wenn nicht)");
        const endLabel = prompt("Möchten Sie das Ende des Gleises benennen? (Leer lassen, wenn nicht)");
        tracks.push({ 
            name: trackName, 
            wagons: [], 
            startLabel: startLabel || null, 
            endLabel: endLabel || null 
        });
        displayTracks();
        saveTracksToFirestore();
    }
}


function createWagon(trackIndex) {
    const wagonName = prompt("Wie soll der Wagon benannt werden?");
    if (wagonName) {
        const positionNumber = tracks[trackIndex].wagons.length + 1;
        tracks[trackIndex].wagons.push({ name: wagonName, position: positionNumber });
        displayTracks();
        saveTracksToFirestore();
    }
}

function searchWagon() {
    const query = prompt("Wie heißt der Wagon, den Sie suchen?");
    if (!query) return;

    let found = false;
    let trackName, position, trackIndex, wagonIndex, status, isAbgestellt;

    for (let i = 0; i < tracks.length; i++) {
        const wagon = tracks[i].wagons.find(w => w.name === query);
        if (wagon) {
            found = true;
            trackName = tracks[i].name;
            position = wagon.position;
            trackIndex = i;
            wagonIndex = tracks[i].wagons.indexOf(wagon);
            status = wagon.status; 
            isAbgestellt = wagon.abgestellt; 
            break;
        }
    }

    if (found) {
        let infoText = `Der Wagon ${query} befindet sich auf Gleis ${trackName} an Position ${position}`;
        if (status === 'Werkstatt') {
            infoText += ` und befindet sich in der ${status}`;
        } else if (status === 'Reinigung') {
            infoText += ` und muss zur ${status}`;
        } else if (isAbgestellt) {
            infoText += ` und ist Abgestellt`; 
        } else if (status === 'Ausgang') {
            infoText += ` und ist bereit für den Ausgang`; 
        }
        alert(infoText);

        
        highlightWagon(trackIndex, wagonIndex);
        scrollToWagon(trackIndex, wagonIndex);
    } else {
        alert(`Der Wagon ${query} wurde nicht gefunden.`);
    }
}



var scroll = new SmoothScroll('a[href*="#"]', {
    speed: 800 // Einstellbare Scroll-Geschwindigkeit
});

function scrollToWagon(trackIndex, wagonIndex) {
    const wagonElement = document.querySelector(`#track-${trackIndex}-wagon-${wagonIndex}`);
    if (wagonElement) {
        let offset = 0;
        if (window.innerWidth <= 768) {
            offset = 200; // Mobilgeräte
        } else {
            offset = 100; // Desktop
        }
        scroll.animateScroll(wagonElement, null, { offset: offset });
    }
}

function highlightWagon(trackIndex, wagonIndex) {
    if (lastHighlightedWagon) {
        lastHighlightedWagon.style.backgroundColor = lastHighlightedWagonOriginalColor;
    }

    const tracksDiv = document.getElementById("tracks");
    const trackDiv = tracksDiv.children[trackIndex];
    const wagonDiv = trackDiv.querySelectorAll(".wagon")[wagonIndex];

    lastHighlightedWagonOriginalColor = window.getComputedStyle(wagonDiv).backgroundColor;
    wagonDiv.style.backgroundColor = 'yellow';
    lastHighlightedWagon = wagonDiv;
}


function saveTracksToFirestore() {
    db.collection("tracks").doc("current").set({ tracks })
        .then(() => console.log("Tracks erfolgreich gespeichert!"))
        .catch((error) => console.error("Fehler beim Speichern der Tracks: ", error));
}

function loadTracksFromFirestore() {
    db.collection("tracks").doc("current").get().then((doc) => {
        if (doc.exists) {
            tracks = doc.data().tracks;
            displayTracks();
        } else {
            console.log("Keine Daten gefunden!");
        }
    }).catch((error) => {
        console.error("Fehler beim Laden der Tracks: ", error);
    });
}

function deleteTrack() {
    const trackName = prompt("Welches Gleis möchten Sie löschen?");
    if (trackName) {
        const trackIndex = tracks.findIndex(track => track.name === trackName);
        if (trackIndex > -1) {
            tracks.splice(trackIndex, 1);
            displayTracks();
            saveTracksToFirestore();
        } else {
            alert(`Das Gleis ${trackName} wurde nicht gefunden.`);
        }
    }
}

function deleteWagon() {
    if (markedWagons.length > 0) { 
        const confirmDelete = confirm("Möchten Sie wirklich alle markierten Wagons löschen?");
        if (confirmDelete) {
            let affectedTracks = [];
            for (let markedId of markedWagons) {
                const [trackIndex, wagonIndex] = markedId.split('-').map(Number);
                tracks[trackIndex].wagons.splice(wagonIndex, 1);
                if (!affectedTracks.includes(trackIndex)) {
                    affectedTracks.push(trackIndex);
                }
            }
            markedWagons = []; 

            
            affectedTracks.forEach(trackIndex => {
                updatePositions(tracks[trackIndex]);
            });

            displayTracks();
            saveTracksToFirestore();
            return;
        }
    }

    
    const wagonName = prompt("Welchen Wagon möchten Sie löschen?");
    if (wagonName) {
        let deleted = false;
        for (let i = 0; i < tracks.length; i++) {
            const wagonIndex = tracks[i].wagons.findIndex(w => w.name === wagonName);
            if (wagonIndex > -1) {
                tracks[i].wagons.splice(wagonIndex, 1);
                deleted = true;

                
                updatePositions(tracks[i]);
                
                break;
            }
        }

        if (deleted) {
            alert(`Der Wagon ${wagonName} wurde gelöscht.`);
            displayTracks();
            saveTracksToFirestore();
        } else {
            alert(`Der Wagon ${wagonName} wurde nicht gefunden.`);
        }
    }
}

function updateWagonPositions(trackIndex) {
    let positionCounter = 1;

    tracks[trackIndex].wagons = tracks[trackIndex].wagons.sort((a, b) => (a.position || 9999) - (b.position || 9999));

    tracks[trackIndex].wagons.forEach(wagon => {
        if (wagon.status !== 'Werkstatt') {
            wagon.position = positionCounter++;
        } else {
            wagon.position = null;
        }
    });
}

function updatePositions(track) {
    let positionCounter = 1;
    for (let i = 0; i < track.wagons.length; i++) {
        if (track.wagons[i].status !== 'Werkstatt') {
            track.wagons[i].position = positionCounter++;
        } else {
            track.wagons[i].position = null;
        }
    }
}
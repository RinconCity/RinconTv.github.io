function changeDiv(id) { //changes between Divs "all movies" and "latest additions"
	if(document.getElementById) {
		if (id != visID){
			if (document.getElementById(visID)){							
				var myDiv = document.getElementById(visID);
				myDiv.style.display = 'none';				
			}	
			myDiv = document.getElementById(id);
			myDiv.style.display = 'block';			
			visID = id;				
		}
		if (id == 'allmovies'){ // print headline
			if (Anz == 1)
				document.getElementById('headline').innerHTML  = 'Filter: "' + document.getElementById('searchString').value + '" (' + Anz.toString() + ' ' + str1Film + ')'
			else if (Anz == movielist.length)
				document.getElementById('headline').innerHTML  = strAlleFilme
			else
				document.getElementById('headline').innerHTML  = 'Filter: "' + document.getElementById('searchString').value + '" (' + Anz.toString() + ' ' + strFilme + ')'	
		}	
		else if (id == 'latest-additions'){ // print headline
			if (Anz == 1)
				document.getElementById('headline_new').innerHTML  = 'Filter: "' + document.getElementById('searchString').value + '" (' + Anz.toString() + ' ' + str1Film + ')'
			else if (Anz == newmovielist.length)
				document.getElementById('headline_new').innerHTML  = strNeueFilme
			else
				document.getElementById('headline_new').innerHTML  = 'Filter: "' + document.getElementById('searchString').value + '" (' + Anz.toString() + ' ' + strFilme + ')'
		}	
	}
}

function Suche(searchString, liste) { // searches a video
	var Anz = 0;
	if ((searchString == '') || (searchString == '*')){ // show all
		for (var i = 0; i < liste.length; i++){

			liste[i].style.display = 'inline-block';
			Anz++;
		}	
	} else
		for (var i = 0; i < liste.length; i++) { //do the search
			if (liste[i].textContent.toLowerCase().includes(searchString)){
				liste[i].style.display = 'inline-block'
				Anz++;	
			} 
			else
				liste[i].style.display = 'none';
		}
	return Anz;	
}	

function Zufallsfilm(liste){ // chooses randomly one movie 
	if (liste.length > 1)
		do // make sure, that it is not the same number twice
			rand = parseInt(Math.random() * (liste.length-1));
		while (rand == VidNr);
	VidNr = rand;

	for (var i = 0; i < liste.length; i++) //hide all movies
		liste[i].style.display = 'none';

	liste[VidNr].style.display = 'inline-block'; //show random movie			
}
/* funtion that returns a random integer between the min(included) and max(excluded) */
function getInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}



function get5UniqueInArray() {
	var arr = [];
	arr.length = 0;
	var arr1 = [1, 6, 11];
	var arr2 = [2, 7, 12];
	var arr3 = [3, 8, 13];
	var arr4 = [4, 9, 14];
	var arr5 = [5, 10, 15];
	var flaq1 = true;
	var flaq2 = true;
	var flaq3 = true;
	var flaq4 = true;
	var flaq5 = true;
	do {
		var b = getInt(1, 16);
		if (arr.indexOf(b) === -1) {
			if ((arr1.indexOf(b) != -1) && flaq1 == true) {
				arr.push(b);
				flaq1 = false;
			} else if ((arr2.indexOf(b) != -1) && flaq2 == true) {
				arr.push(b);
				flaq2 = false;
			} else if ((arr3.indexOf(b) != -1) && flaq3 == true) {
				arr.push(b);
				flaq3 = false;
			} else if ((arr4.indexOf(b) != -1) && flaq4 == true) {
				arr.push(b);
				flaq4 = false;
			} else if ((arr5.indexOf(b) != -1) && flaq5 == true) {
				arr.push(b);
				flaq5 = false;
			}
		}
	} while (arr.length < 5);
	return arr;
}

function clearDisplay() {
	var nz = document.getElementsByClassName("A10Images");
	for (var i = 0; i < nz.length; i++) {
		nz[i].style.display = "none";
	}
}


function showNewImage() {
	var bz = document.getElementsByClassName("A10Images");
	var mg1 = document.getElementById("imgdiv1");
	var mg2 = document.getElementById("imgdiv2");
	var mg3 = document.getElementById("imgdiv3");
	var mg4 = document.getElementById("imgdiv4");
	var mg5 = document.getElementById("imgdiv5");

	var uniq = get5UniqueInArray();

	bz[0].style.display = "inline";
	bz[1].style.display = "inline";
	bz[2].style.display = "inline";
	bz[3].style.display = "inline";
	bz[4].style.display = "inline";
	mg1.src = "./slideImages/t" + (uniq[0]) + ".png";
	mg2.src = "./slideImages/t" + (uniq[1]) + ".png";
	mg3.src = "./slideImages/t" + (uniq[2]) + ".png";
	mg4.src = "./slideImages/t" + (uniq[3]) + ".png";
	mg5.src = "./slideImages/t" + (uniq[4]) + ".png";


}

var firstMethod = function () {
	var promise = new Promise(function (resolve, reject) {
		setTimeout(function () {
			clearDisplay();
			resolve({

			});
		}, 300);
	});
	return promise;
};

var secondMethod = function () {
	var promise = new Promise(function (resolve, reject) {
		setTimeout(function () {
			showNewImage();
			resolve({});
		}, 0);
	});
	return promise;
};

function pressButtNewImage() {
	firstMethod()
		.then(secondMethod);
}

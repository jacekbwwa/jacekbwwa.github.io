document.body.onload = function() {
			let start = Date.now();
			let moveBackPacker = setInterval(function() {
				let timeElapsed = Date.now() - start;
				backpacker.style.bottom = timeElapsed / 2 + 'px';
				if (timeElapsed > 4000) clearInterval(moveBackPacker);

			}, 20);
		}
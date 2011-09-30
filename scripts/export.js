
// NOTE: Called via `commonjs --script export ...`

exports.main = function(env)
{

	module.load({
		
	    "location": module.id.replace(/\/[^\/]*\/[^\/]*$/, "/programs/program-exporter")
	    
	}, function(id)
	{
		require(id).main(env);
	});

}

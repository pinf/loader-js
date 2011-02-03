function breakPoint(max, line)
{
  if (line.length <= max)
    return line.length;
  line = line.slice(0,max);

  var ls;
  var spots = [ line.lastIndexOf('}'), line.lastIndexOf(',') + 1, line.lastIndexOf(';') + 1, line.lastIndexOf('{') + 1, line.lastIndexOf(' ') + 1];
  var bp = max * 0.5;

  for (i = 0; i < spots.length; i++)
    if (spots[i] >= bp)
      return spots[i] > max ? max : spots[i];

  ls = line.lastIndexOf(' ');
  if (ls == -1)
    return max;
  return ls;
}

function wrap(leader, max, line)
{
  var a = [ ];
  var end;

  while (line.length)
  {
    end = breakPoint(max, line);
    if (!end)
    {
      a.push(leader + line);
      break;
    }
    a.push(leader + line.slice(0, end));
    line = line.slice(end);
  }
  if (!a.length)
    return "";

  return a.join("\n");
}

function cols(maxWidth, divider, mainLeader, subLeader, joiner, text)
{
  var a;
  var i;
  var max = 0;
  var na = [];
  var first;
  var next;
  var bp;

  function spaces(howMany)
  {
    if (howMany < 1)
      return "";
    var spaces = "";
    while(howMany--)
      spaces += " ";
    return spaces;
  }

  a = text.split("\n");
  for (i=0; i < a.length; i++)
    a[i] = a[i].split(divider);

  for (i = 0; i < a.length; i++)
    if (a[i][0].length > max)
    {
      max = a[i][0].length;
      if (max > maxWidth)
      {
	max = maxWidth;
	break;
      }
    }

  for (i = 0; i < a.length; i++)
  {
    if (!a[i][0] && !a[i][1])
      continue;

    if (a[i][0])
    {
      bp = breakPoint(max, a[i][0]);
      first = a[i][0].slice(0,bp);
      next  = a[i][0].slice(bp);
    }
    else
    {
      first = next = "";
    }

    if (a[i][1])
      first += spaces(max - first.length) + joiner + a[i][1];

    na.push(mainLeader + first);

    next = wrap(subLeader, max, next);
    if (next.length)
      na.push(next);
  }

  return na.join("\n");
}

bravojs.errorReporter = function uncaught_exception(e)
{
  var stack;
  var i;

  bravojs.print("\n * Uncaught exception: " + e + " in ");

  if (e.stack)
  {
    stack = e.stack.toString();
    if (stack.slice(0,5) === "Error")
    {
      i = stack.indexOf("@:0");
      if (i !== -1)
	stack = stack.slice(i + 3);
    }      

    stack = stack.split(bravojs.dirname("@" + window.location.href)).join("@.");
    stack = stack.split(bravojs.dirname("@" + bravojs.url)).join("@<BravoJS>");
    stack = stack.split(".js?1:").join(".js:");
    bravojs.print(cols(115, "@", "   > ", "       ", "   at ", stack));
  }
}

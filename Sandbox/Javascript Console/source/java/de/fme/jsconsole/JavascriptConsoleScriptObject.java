package de.fme.jsconsole;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;

import org.alfresco.repo.jscript.ScriptNode;
import org.alfresco.service.cmr.repository.NodeRef;
import org.mozilla.javascript.NativeArray;
import org.springframework.extensions.webscripts.ScriptValueConverter;

public class JavascriptConsoleScriptObject {

	private List<String> printOutput = new ArrayList<String>();

	public void print(Object obj) {

		if (obj != null) {

			Object value = ScriptValueConverter.unwrapValue(obj);

			if (value instanceof Collection<?>) {
				Collection<?> col = (Collection<?>) value;
				Iterator<?> colIter = col.iterator();
				int counter = 0;
				while (colIter.hasNext()) {
					printOutput.add("" + counter + " : "
							+ formatValue(colIter.next()));
					counter++;
				}
			} else {
				printOutput.add(formatValue(value));
			}
		} else {
			printOutput.add("null");
		}

	}

	private String formatValue(Object value) {
		if (value instanceof ScriptNode) {
			return formatScriptNode((ScriptNode) value);
		} else if (value instanceof NodeRef) {
			return formatNodeRef((NodeRef) value);
		}
		return value.toString();
	}

	private String formatNodeRef(NodeRef value) {
		return value.toString();
	}

	private String formatScriptNode(ScriptNode value) {
		return value.getName() + " (" + value.getNodeRef() + ")";
	}

	public List<String> getPrintOutput() {
		return printOutput;
	}

}

<!--[if IE]>
<iframe id="yui-history-iframe" src="${url.context}/res/yui/history/assets/blank.html"></iframe> 
<![endif]-->
<input id="yui-history-field" type="hidden" />

<#assign el=args.htmlid?html>
<script type="text/javascript">//<![CDATA[
   new Fme.JavascriptConsole("${el}").setMessages(${messages});
//]]></script>
</script>

<div id="${el}-body" class="javascript-console">

	<div id="${el}-main" class="hidden">
	    <div class="buttonbar">
	    	<div class="scriptmenu">
				<div id="${el}-scriptload"></div>
	    	</div>
	    	<div class="scriptmenu">
				<div id="${el}-scriptsave"></div>
	    	</div>
	    	<div class="scriptmenu">
				<div id="${el}-documentation"></div>
	    	</div>
	    	
			${msg("label.run.with")} <b>var space = </b>
			<span id="${el}-pathField" name="pathField" value=""></span> 	
			<input id="${el}-nodeRef" type="hidden" name="spaceNodeRef" value=""/>
			<button id="${el}-selectDestination-button" tabindex="0">${msg("button.select")}</button>
		</div>
		<div id="${el}-inputTabs" class="yui-navset">
		    <ul class="yui-nav">
		        <li class="selected"><a href="#itab1"><em>Javascript input</em></a></li>
		        <li><a href="#itab2"><em>Freemarker input</em></a></li>
		        <li><a href="#itab3"><em>Script execution parameters</em></a></li>
		    </ul>            
		    <div id="${el}-inputContentArea" class="yui-content">
		        <div>
					<div id="${el}-editorResize">
						<textarea id="${el}-jsinput" name="jsinput" cols="80" rows="5" class="jsbox"></textarea>
					</div>
				</div>
		        <div>
					<textarea id="${el}-templateinput" name="templateinput" cols="80" rows="5" class="templateInputBox"></textarea>
				</div>
		        <div>
		        	<div class="configform">
			        	<div class="control">
			        		<span class="label">Webscript URL arguments:</span>
			        		<input id="${el}-urlarguments" type="text" size="50"/>
			        	</div>
			        	<div class="control">
			        		<span class="label">Run script as:</span>
			        		<input id="${el}-runas" type="text" size="20" value="admin"/>
			        	</div>
			        	<div class="control">
			        		<span class="label">Transaction isolation:</span>
			        		<select id="${el}-transactions" value="readwrite">
			        			<option value="none">none</option>
			        			<option value="readonly">readonly</option>
			        			<option value="readwrite">readwrite</option>
			        		</select>
			        	</div>
			        </div>
		        </div>
		    </div>
		</div>
		<div class="execute-buttonbar">
			<button type="submit" name="${el}-execute-button" id="${el}-execute-button">${msg("button.execute")}</button>
			 ${msg("label.execute.key")}
			 <img id="${el}-spinner" src="${page.url.context}/res/components/images/ajax_anim.gif" class="spinner" width="16" height="16"></img> 
		</div>
		<div id="${el}-outputTabs" class="yui-navset">
		    <ul class="yui-nav">
		        <li class="selected"><a href="#otab1"><em>Console output</em></a></li>
		        <li><a href="#otab2"><em>Freemarker output</em></a></li>
		        <li><a href="#otab3"><em>Datatable output</em></a></li>
		    </ul>            
		    <div class="yui-content">
		        <div>
				    <p id="${el}-jsoutput" class="jsbox"></p>
				</div>
		        <div>		
				    <div id="${el}-templateoutput" class="templateOutputBox"></div>
				</div>
		    	<div>
	  	        	<div id="${el}-datatable" style="display:none;"></div>
  		        	<div class="exportButton">
  	    	    		<button id="${el}-exportResults-button" tabindex="0">${msg("button.export.results")}</button>
  	        		</div>
  	        	</div>
		    </div>
		</div>
	    <div id="${el}-executionStats" class="executionStats"></div>
	</div>
</div>

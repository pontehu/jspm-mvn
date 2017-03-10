package hu.ponte.jspmmvn;

/**
 * Created with IntelliJ IDEA.
 * User: zenorbi
 * Date: 2016-05-09
 * Time: 10:36
 */
public class JsonError {
    public String message;
    public boolean errored;
    JsonError(Exception e) {
        errored = true;
        message = e.getMessage();
    }
}
